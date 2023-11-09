// @ts-check
import get from 'lodash/get'
import retry from 'bluebird-retry'
import { models } from 'cozy-client'
import { dataUriToArrayBuffer } from '../libs/utils'

/**
 * @typedef saveFilesEntry
 * @property {string} [fileurl] - url where to download the corresponding file
 * @property {string} [filename] - name of the file
 * @property {string | ArrayBuffer} [filestream] - name of the file
 * @property {boolean} [_cozy_file_to_create] - Internal use to count the number of files to download
 * @property {object} [fileAttributes] - metadata attributes to add to the resulting file object
 */

/**
 * @typedef saveFilesOptions
 * @property {string} sourceAccount - id of the associated cozy account
 * @property {string} sourceAccountIdentifier - unique identifier of the website account
 * @property {import('cozy-client/types/types').Manifest} manifest - name of the file
 * @property {Array<string>} fileIdAttributes - List of entry attributes considered as unique deduplication key
 * @property {Function} log - Logging function coming from the Launcher
 * @property {string} [subPath] - subPath of the destination folder path where to put the downloaded file
 * @property {Function} [postProcess] - callback called after the file is download to further modify it
 * @property {string} [contentType] - will force the contentType of the file if any
 * @property {Function} [shouldReplaceFile] - Function which will define if the file should be replaced or not
 * @property {Function} [validateFile] - this function will check if the downloaded file is correct (by default, error if file size is 0)
 * @property {Function} [downloadAndFormatFile] - this callback will download the file and format to be useable by cozy-client
 * @property {string} [qualificationLabel] - qualification label defined in cozy-client which will be used on all given files
 * @property {number} [retry] - number of retries if the download of a file failes. No retry by default
 * @property {Map<import('cozy-client/types/types').FileDocument>} existingFilesIndex - index of existing files
 */

/**
 * @typedef saveFileOptions
 * @property {import('cozy-client/types/types').Manifest} manifest - name of the file
 * @property {Array<string>} fileIdAttributes - List of entry attributes considered as unique deduplication key
 * @property {Function} log - Logging function coming from the Launcher
 * @property {string} [subPath] - subPath of the destination folder path where to put the downloaded file
 * @property {Function} [postProcess] - callback called after the file is download to further modify it
 * @property {string} [contentType] - will force the contentType of the file if any
 * @property {Function} [shouldReplaceFile] - Function which will define if the file should be replaced or not
 * @property {Function} [validateFile] - this function will check if the downloaded file is correct (by default, error if file size is 0)
 * @property {Function} [downloadAndFormatFile] - this callback will download the file and format to be useable by cozy-client
 * @property {string} [qualificationLabel] - qualification label defined in cozy-client which will be used on all given files
 * @property {number} [retry] - number of retries if the download of a file failes. No retry by default
 * @property {string} [folderPath] - path to the destination folder
 * @property {Map<import('cozy-client/types/types').FileDocument>} existingFilesIndex - index of existing files
 */

/**
 * Saves the given files to the cozy stack
 *
 * @param {import('cozy-client/types/CozyClient')} client - CozyClient instance
 * @param {Array<saveFilesEntry>} entries - file entries
 * @param {string} folderPath - path to the destination folder
 * @param {saveFilesOptions} options - saveFiles options
 * @returns {Promise<Array<saveFilesEntry>>} - resulting entries
 */
const saveFiles = async (client, entries, folderPath, options) => {
  if (!entries) {
    throw new Error('Savefiles : No list of files given')
  }
  if (entries.length === 0) {
    options.log('warning', 'saveFiles', 'No file to download')
  }
  if (!options.manifest) {
    throw new Error('Savefiles : no manifest')
  }
  if (!options.sourceAccount) {
    throw new Error('Savefiles : no sourceAccount')
  }
  if (!options.sourceAccountIdentifier) {
    throw new Error('Savefiles : no sourceAccountIdentifier')
  }
  if (!client) {
    throw new Error('Savefiles : No cozy-client instance given')
  }

  if (!options.fileIdAttributes) {
    throw new Error('Savefiles : No fileIdAttributes')
  }

  if (!options.existingFilesIndex) {
    throw new Error('Savefiles : No existingFilesIndex given')
  }

  const saveOptions = {
    folderPath,
    log: (level, label, msg) => {
      if (options.log) {
        options.log({
          level,
          namespace: 'saveFiles',
          label,
          msg
        })
      } else {
        // eslint-disable-next-line no-console
        console.log(`${level}: saveFiles: ${label}: ${msg}`)
      }
    },
    subPath: options.subPath,
    fileIdAttributes: options.fileIdAttributes,
    manifest: options.manifest,
    postProcess: options.postProcess,
    contentType: options.contentType,
    shouldReplaceFile: options.shouldReplaceFile,
    validateFile: options.validateFile || defaultValidateFile,
    downloadAndFormatFile: options.downloadAndFormatFile,
    qualificationLabel: options.qualificationLabel,
    sourceAccountOptions: {
      sourceAccount: options.sourceAccount,
      sourceAccountIdentifier: options.sourceAccountIdentifier
    },
    existingFilesIndex: options.existingFilesIndex
  }

  noMetadataDeduplicationErrors(saveOptions)

  let savedFiles = 0
  const savedEntries = []
  for (let entry of entries) {
    const start = Date.now()
    ;['filename', 'shouldReplaceName'].forEach(key =>
      addValOrFnResult(entry, key, options)
    )

    if (!entry.filename) {
      saveOptions.log(
        'warning',
        '',
        'Missing filename property, entry is ignored'
      )
      continue
    }
    const folderPath = await getOrCreateDestinationPath(
      client,
      entry,
      saveOptions
    )
    entry = await saveFile(client, entry, {
      ...saveOptions,
      folderPath
    })
    if (entry && entry._cozy_file_to_create) {
      savedFiles++
      delete entry._cozy_file_to_create
    }
    savedEntries.push(entry)
    const end = Date.now()
    saveOptions.log(
      'debug',
      'saveFile',
      `⌛ saveFile took ${Math.round((end - start) / 10) / 100}s`
    )
  }

  saveOptions.log(
    'debug',
    '',
    `Created ${savedFiles} files for ${
      savedEntries ? savedEntries.length : 'n'
    } entries`
  )
  return savedEntries
}

/**
 * Saves a single file entry
 *
 * @param {import('cozy-client/types/CozyClient')} client - CozyClient instance
 * @param {saveFilesEntry} entry - file entry
 * @param {saveFileOptions} options - saveFiles options
 * @returns {Promise<saveFilesEntry>} - resulting file entry with file document
 */
const saveFile = async function (client, entry, options) {
  let file = options.existingFilesIndex.get(
    calculateFileKey(entry, options.fileIdAttributes)
  )

  if (options.qualificationLabel) {
    if (!entry.fileAttributes) {
      entry.fileAttributes = {}
    }
    if (!entry.fileAttributes.metadata) {
      entry.fileAttributes.metadata = {}
    }
    entry.fileAttributes.metadata.qualification =
      models.document.Qualification.getByLabel(options.qualificationLabel)
  }

  if (entry.fileurl && !file && options.downloadAndFormatFile) {
    const downloadedEntry = await options.downloadAndFormatFile(entry)
    entry.dataUri = downloadedEntry.dataUri
    delete entry.fileurl
  }

  if (entry.dataUri) {
    const start = Date.now()
    const { arrayBuffer } = dataUriToArrayBuffer(entry.dataUri)
    const end = Date.now()
    options.log(
      'debug',
      'saveFile',
      `⌛ dataUriToArrayBuffer took ${Math.round((end - start) / 10) / 100}s`
    )
    if (arrayBuffer) {
      entry.filestream = arrayBuffer
      delete entry.dataUri
    } else {
      throw new Error('saveFiles: failed to convert dataUri to filestream')
    }
  }
  let shouldReplace = false
  if (file) {
    try {
      shouldReplace = await shouldReplaceFile(file, entry, options)
    } catch (err) {
      options.log(
        'warn',
        'saveFile',
        `Error in shouldReplaceFile : ${err.message}`
      )
      shouldReplace = true
    }
  }

  let method = 'create'

  if (shouldReplace && file) {
    method = 'updateById'
    options.log(
      'debug',
      'saveFile',
      `Will replace ${getFilePath({ options, file })}...`
    )
  }

  try {
    if (!file || method === 'updateById') {
      logFileStream(entry.filestream, options)
      options.log(
        'debug',
        'saveFile',
        `File ${getFilePath({
          options,
          entry
        })} does not exist yet or is not valid`
      )
      entry._cozy_file_to_create = true
      file = await retry(createFile, {
        interval: 1000,
        throw_original: true,
        max_tries: options.retry,
        args: [client, entry, options, method, file ? file : undefined]
      }).catch(err => {
        if (err.message === 'BAD_DOWNLOADED_FILE') {
          options.log(
            'warning',
            'saveFile',
            `Could not download file after ${options.retry} tries removing the file`
          )
        } else {
          options.log(
            'warning',
            'saveFile',
            'unknown file download error: ' + err.message
          )
          options.log('warning', 'saveFile', err.message)
        }
      })
    }

    attachFileToEntry(entry, file)

    sanitizeEntry(entry)
    if (options.postProcess) {
      await options.postProcess(entry)
    }
  } catch (err) {
    if (getErrorStatus(err) === 413) {
      // the cozy quota is full
      throw new Error('DISK_QUOTA_EXCEEDED')
    }
    options.log('warning', 'saveFile', 'SAVE_FILE_FAILED')
    options.log('warning', 'saveFile', err.message)
    options.log(
      'warning',
      'saveFile',
      `Error caught while trying to save the file ${
        entry.fileurl ? entry.fileurl : entry.filename
      }`
    )
  }
  return entry
}

function noMetadataDeduplicationErrors(options) {
  const fileIdAttributes = options.fileIdAttributes
  if (!fileIdAttributes) {
    throw new Error(
      'Savefiles : No deduplication key is defined, file deduplication will be based on file path'
    )
  }

  const slug = get(options, 'manifest.slug')
  if (!slug) {
    throw new Error('Savefiles : No slug is defined for the current connector')
  }
}

async function createFile(client, entry, options, method, file) {
  const folder = await client
    .collection('io.cozy.files')
    .statByPath(options.folderPath)
  let createFileOptions = {
    name: getFileName(entry, options),
    dirId: folder.data._id
  }
  if (options.contentType) {
    createFileOptions.contentType = options.contentType
  }
  createFileOptions = {
    ...createFileOptions,
    ...entry.fileAttributes,
    ...options.sourceAccountOptions
  }

  if (options.fileIdAttributes) {
    createFileOptions = {
      ...createFileOptions,
      ...{
        metadata: {
          ...createFileOptions.metadata,
          fileIdAttributes: calculateFileKey(entry, options.fileIdAttributes)
        }
      }
    }
  }

  const toCreate = entry.filestream

  if (toCreate == undefined) {
    throw new Error('saveFiles got undefined file content (entry.filestream)')
  }

  let fileDocument
  const start = Date.now()
  if (method === 'create') {
    const clientResponse = await client.save({
      _type: 'io.cozy.files',
      type: 'file',
      data: toCreate,
      ...createFileOptions
    })
    fileDocument = clientResponse.data
  } else if (method === 'updateById') {
    options.log('debug', 'createFile', `replacing file for ${entry.filename}`)
    const clientResponse = client.save({
      _id: file._id,
      _rev: file._rev,
      _type: 'io.cozy.files',
      data: toCreate,
      ...createFileOptions
    })
    fileDocument = clientResponse.data
  }
  const end = Date.now()
  options.log(
    'debug',
    'createFile',
    `⌛ client.save took ${Math.round((end - start) / 10) / 100}s`
  )
  if (options.validateFile) {
    if ((await options.validateFile(fileDocument, options)) === false) {
      await removeFile(client, fileDocument, options)
      throw new Error('BAD_DOWNLOADED_FILE')
    }
  }

  return fileDocument
}

const defaultShouldReplaceFile = (file, entry, options) => {
  const shouldForceMetadataAttr = attr => {
    const result =
      !getAttribute(file, `metadata.${attr}`) &&
      get(entry, `fileAttributes.metadata.${attr}`)
    if (result) {
      options.log(
        'debug',
        'defaultShouldReplaceFile',
        `filereplacement: adding ${attr} metadata`
      )
    }
    return result
  }
  // replace all files with meta if there is file metadata to add
  const fileHasNoMetadata = !getAttribute(file, 'metadata')
  const fileHasNoId = !getAttribute(file, 'metadata.fileIdAttributes')
  const entryHasMetadata = !!get(entry, 'fileAttributes.metadata')
  const hasSourceAccountIdentifierOption = !!get(
    options,
    'sourceAccountOptions.sourceAccountIdentifier'
  )
  const fileHasSourceAccountIdentifier = !!getAttribute(
    file,
    'cozyMetadata.sourceAccountIdentifier'
  )
  const result =
    (fileHasNoMetadata && entryHasMetadata) ||
    (fileHasNoId && !!options.fileIdAttributes) ||
    (hasSourceAccountIdentifierOption && !fileHasSourceAccountIdentifier) ||
    shouldForceMetadataAttr('carbonCopy') ||
    shouldForceMetadataAttr('electronicSafe') ||
    shouldForceMetadataAttr('categories')

  if (result) {
    if (fileHasNoMetadata && entryHasMetadata) {
      options.log(
        'debug',
        'defaultShouldReplaceFile',
        'filereplacement: metadata to add'
      )
    }
    if (fileHasNoId && !!options.fileIdAttributes) {
      options.log(
        'debug',
        'defaultShouldReplaceFile',
        'filereplacement: adding fileIdAttributes'
      )
    }
    if (hasSourceAccountIdentifierOption && !fileHasSourceAccountIdentifier) {
      options.log(
        'debug',
        'defaultShouldReplaceFile',
        'filereplacement: adding sourceAccountIdentifier'
      )
    }
  }

  return result
}

const shouldReplaceFile = async function (file, entry, options) {
  const isValid = !options.validateFile || (await options.validateFile(file))
  if (!isValid) {
    options.log(
      'warning',
      'shouldReplaceFile',
      `${getFileName({ file, options })} is invalid`
    )
    throw new Error('BAD_DOWNLOADED_FILE')
  }
  const shouldReplaceFileFn =
    entry.shouldReplaceFile ||
    options.shouldReplaceFile ||
    defaultShouldReplaceFile

  return shouldReplaceFileFn(file, entry, options)
}

const removeFile = async function (client, file, options) {
  if (!client) {
    options.log('error', 'removeFile', 'No client, impossible to delete file')
  } else {
    await client.collection('io.cozy.files').deleteFilePermanently(file._id)
  }
}

module.exports = saveFiles

function getFileName(entry, options) {
  let filename
  if (entry.filename) {
    filename = entry.filename
  } else {
    options.log(
      'error',
      'getFileName',
      'Could not get a file name for the entry'
    )
    return false
  }
  return sanitizeFileName(filename)
}

function sanitizeFileName(filename) {
  return filename.replace(/^\.+$/, '').replace(/[/?<>\\:*|":]/g, '')
}

function checkFileSize(fileobject, options) {
  const size = getAttribute(fileobject, 'size')
  const name = getAttribute(fileobject, 'name')
  if (size === 0 || size === '0') {
    options.log('warning', 'checkFileSize', `${name} is empty`)
    options.log('warning', 'checkFileSize', 'BAD_FILE_SIZE')
    return false
  }
  return true
}

function logFileStream(fileStream, options) {
  if (!fileStream) {
    return
  }

  if (fileStream && fileStream.constructor && fileStream.constructor.name) {
    options.log(
      'debug',
      'logFileStream',
      `The fileStream attribute is an instance of ${fileStream.constructor.name}`
    )
  } else {
    options.log(
      'debug',
      'logFileStream',
      `The fileStream attribute is a ${typeof fileStream}`
    )
  }
}

function getErrorStatus(err) {
  try {
    return Number(JSON.parse(err.message).errors[0].status)
  } catch (e) {
    return null
  }
}

function addValOrFnResult(entry, key, options) {
  if (entry[key]) {
    entry[key] = getValOrFnResult(entry[key], entry, options)
  }
}

function getValOrFnResult(val, ...args) {
  if (typeof val === 'function') {
    return val.apply(val, args)
  } else {
    return val
  }
}

function calculateFileKey(entry, fileIdAttributes) {
  return fileIdAttributes
    .sort()
    .map(key => get(entry, key))
    .join('####')
}

function defaultValidateFile(fileDocument, options) {
  return checkFileSize(fileDocument, options)
}

function sanitizeEntry(entry) {
  delete entry.fetchFile
  delete entry.requestOptions
  delete entry.filestream
  delete entry.shouldReplaceFile
  return entry
}

function attachFileToEntry(entry, fileDocument) {
  entry.fileDocument = fileDocument
  return entry
}

/**
 * Get the full path of a given file, from it's folder path and file or entry
 *
 * @param {Object} arg - arg option object
 * @param {import('cozy-client/types/types').FileDocument} [arg.file] - io.cozy.files object
 * @param {saveFilesEntry} [arg.entry] - saveFiles entry
 * @param {saveFileOptions} arg.options - io.cozy.files object
 * @returns {string | undefined} - file full path
 */
function getFilePath({ file, entry, options }) {
  const folderPath = options.folderPath
  if (file) {
    return folderPath + '/' + getAttribute(file, 'name')
  } else if (entry) {
    return folderPath + '/' + getFileName(entry, options)
  }
}

function getAttribute(obj, attribute) {
  return get(obj, `attributes.${attribute}`, get(obj, attribute))
}

async function getOrCreateDestinationPath(client, entry, saveOptions) {
  const subPath = entry.subPath || saveOptions.subPath
  let finalPath = saveOptions.folderPath
  if (subPath) {
    finalPath += '/' + subPath
    await client.collection('io.cozy.files').createDirectoryByPath(finalPath)
  }
  return finalPath
}
