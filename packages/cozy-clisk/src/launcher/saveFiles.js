// @ts-check
import get from 'lodash/get'
import retry from 'bluebird-retry'
import { models } from 'cozy-client'
import { dataUriToArrayBuffer } from '../libs/utils'

/**
 * @typedef saveFilesEntry
 * @property {string} [fileurl] - url where to download the corresponding file
 * @property {string} [filename] - name of the file
 * @property {string} [dataUri] - base64 representation of the content of the file
 * @property {string | ArrayBuffer} [filestream] - name of the file
 * @property {boolean} [_cozy_file_to_create] - Internal use to count the number of files to download
 * @property {object} [fileAttributes] - metadata attributes to add to the resulting file object
 * @property {string} [subPath] - subPath of the destination folder path where to put the downloaded file
 * @property {import('cozy-client/types/types').IOCozyFile} [existingFile] - already existing file corresponding to the entry
 * @property {boolean} [shouldReplace] - result of the shouldReplaceFile function on the entry
 */

/**
 * @typedef saveFilesOptions
 * @property {string} sourceAccount - id of the associated cozy account
 * @property {string} sourceAccountIdentifier - unique identifier of the website account
 * @property {import('cozy-client/types/types').Manifest} manifest - name of the file
 * @property {Array<string>} fileIdAttributes - List of entry attributes considered as unique deduplication key
 * @property {Function} log - Logging function coming from the Launcher
 * @property {string} [subPath] - subPath of the destination folder path where to put the downloaded file
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
 * @property {string} [contentType] - will force the contentType of the file if any
 * @property {Function} [shouldReplaceFile] - Function which will define if the file should be replaced or not
 * @property {Function} [validateFile] - this function will check if the downloaded file is correct (by default, error if file size is 0)
 * @property {Function} [downloadAndFormatFile] - this callback will download the file and format to be useable by cozy-client
 * @property {string} [qualificationLabel] - qualification label defined in cozy-client which will be used on all given files
 * @property {number} [retry] - number of retries if the download of a file failes. No retry by default
 * @property {string} [folderPath] - path to the destination folder
 * @property {Map<import('cozy-client/types/types').FileDocument>} existingFilesIndex - index of existing files
 * @property {object} sourceAccountOptions - source account options
 * @property {object} sourceAccountOptions.sourceAccount - source account object _id
 * @property {object} sourceAccountOptions.sourceAccountIdentifier - source account unique identifier (mostly user login)
 */

/**
 * Saves the given files to the cozy stack
 *
 * @param {import('cozy-client/types/CozyClient').default} client - CozyClient instance
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
    retry: options.retry,
    subPath: options.subPath,
    fileIdAttributes: options.fileIdAttributes,
    manifest: options.manifest,
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

  const savedEntries = []
  const toSaveEntries = []

  // do not create subPath folder or call saveFile for existing files or files that don't need to be replaced
  for (const entry of entries) {
    const existingFile = options.existingFilesIndex.get(
      calculateFileKey(entry, options.fileIdAttributes)
    )
    const shouldReplace = shouldReplaceFile(existingFile, entry, saveOptions)
    if (!existingFile || shouldReplace) {
      toSaveEntries.push({ ...entry, existingFile, shouldReplace })
    } else {
      savedEntries.push({ ...entry, fileDocument: existingFile })
    }
  }

  await ensureAllDestinationFolders({
    client,
    entries: toSaveEntries,
    folderPath,
    options: saveOptions
  })

  let savedFiles = 0
  for (const entry of toSaveEntries) {
    const start = Date.now()
    ;['filename'].forEach(key => addValOrFnResult(entry, key, options))

    if (!entry.filename) {
      saveOptions.log(
        'warning',
        '',
        'Missing filename property, entry is ignored'
      )
      continue
    }
    const savedEntry = await saveFile(client, entry, {
      ...saveOptions
    })
    if (savedEntry && savedEntry._cozy_file_to_create) {
      savedFiles++
      delete savedEntry._cozy_file_to_create
    }
    savedEntries.push(savedEntry)
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
 * Ensure the existence of all destination folders : folderPath, options.subPath and all subPaths
 * which may be present in each entries.
 * If the user changes some folders during the execution of saveFile, we will catch and fix the
 * errors.
 *
 * @param {object} options - Options object
 * @param {import('cozy-client/types/CozyClient').default} options.client - CozyClient instance
 * @param {Array<saveFilesEntry>} options.entries - file entry
 * @param {saveFileOptions} options.options - saveFiles options
 * @param {string} options.folderPath - path to the destination folder
 * @returns {Promise<void>}
 */
async function ensureAllDestinationFolders({
  client,
  entries,
  folderPath,
  options
}) {
  const fileCollection = client.collection('io.cozy.files')

  const pathsList = []

  // construct an Array with all the paths to ensure the existence of
  if (options.subPath) {
    pathsList.push(folderPath + '/' + options.subPath)
  }
  const notFilteredEntriesPathList = entries.map(entry =>
    entry.subPath ? folderPath + '/' + entry.subPath : false
  )
  const entriesPathList = Array.from(
    new Set(notFilteredEntriesPathList)
  ).filter(Boolean)
  // @ts-ignore Argument of type 'string | false' is not assignable to parameter of type 'string'.  Type 'boolean' is not assignable to type 'string'.ts(2345)
  pathsList.push(...entriesPathList)

  for (const path of pathsList) {
    await fileCollection.ensureDirectoryExists(path)
  }
}

/**
 * Saves a single file entry
 *
 * @param {import('cozy-client/types/CozyClient').default} client - CozyClient instance
 * @param {saveFilesEntry} entry - file entry
 * @param {saveFileOptions} options - saveFiles options
 * @returns {Promise<saveFilesEntry>} - resulting file entry with file document
 */
const saveFile = async function (client, entry, options) {
  const resultEntry = { ...entry }
  if (options.qualificationLabel) {
    if (!resultEntry.fileAttributes) {
      resultEntry.fileAttributes = {}
    }
    if (!resultEntry.fileAttributes.metadata) {
      resultEntry.fileAttributes.metadata = {}
    }
    resultEntry.fileAttributes.metadata.qualification = {
      ...models.document.Qualification.getByLabel(options.qualificationLabel)
    }
  }

  if (entry.fileurl && !entry.existingFile && options.downloadAndFormatFile) {
    const downloadedEntry = await options.downloadAndFormatFile(entry)
    resultEntry.dataUri = downloadedEntry.dataUri
    delete resultEntry.fileurl
  }

  if (resultEntry.dataUri) {
    const start = Date.now()
    const { arrayBuffer } = dataUriToArrayBuffer(resultEntry.dataUri)
    const end = Date.now()
    options.log(
      'debug',
      'saveFile',
      `⌛ dataUriToArrayBuffer took ${Math.round((end - start) / 10) / 100}s`
    )
    if (arrayBuffer) {
      resultEntry.filestream = arrayBuffer
      delete resultEntry.dataUri
    } else {
      throw new Error('saveFiles: failed to convert dataUri to filestream')
    }
  }

  let method = 'create'
  if (resultEntry.shouldReplace && resultEntry.existingFile) {
    method = 'updateById'
    options.log(
      'debug',
      'saveFile',
      `Will replace ${getFilePath({
        options,
        file: resultEntry.existingFile
      })}...`
    )
  }

  let createdFile
  try {
    if (!resultEntry.existingFile || method === 'updateById') {
      logFileStream(resultEntry.filestream, options)
      options.log(
        'debug',
        'saveFile',
        `File ${getFilePath({
          options,
          entry: resultEntry
        })} does not exist yet or is not valid`
      )
      resultEntry._cozy_file_to_create = true
      createdFile = await retry(createFileWithFolderOnError, {
        interval: 1000,
        throw_original: true,
        max_tries: options.retry,
        args: [client, resultEntry, options, method, resultEntry.existingFile]
      }).catch(err => {
        if (err.message === 'MAIN_FOLDER_REMOVED') {
          throw err
        }
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

    attachFileToEntry(resultEntry, createdFile)

    sanitizeEntry(resultEntry)
  } catch (err) {
    if (err.message === 'MAIN_FOLDER_REMOVED') {
      throw err
    }
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
        resultEntry.fileurl || resultEntry.filename
      }`
    )
  }
  return resultEntry
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

/**
 * If createFile fails for non existing destination folder, create the destrination folder and
 * retry createFile. This is done for the case where the destination folder is removed during the
 * execution of the konnector
 */
async function createFileWithFolderOnError(
  client,
  entry,
  options,
  method,
  file
) {
  const subPath = entry.subPath || options.subPath
  const finalPath = subPath
    ? options.folderPath + '/' + subPath
    : options.folderPath

  const fileCollection = client.collection('io.cozy.files')
  try {
    let dirId
    if (finalPath === options.folderPath) {
      // we don't want to recreate the main folder, it's the role of the launcher
      const resp = await fileCollection.statByPath(finalPath)
      dirId = resp.data._id
    } else {
      dirId = await fileCollection.ensureDirectoryExists(finalPath)
    }
    return await createFile({
      client,
      entry,
      options,
      method,
      file,
      dirId
    })
  } catch (err) {
    if (err.response?.status === 404) {
      if (finalPath === options.folderPath) {
        // do not try to recreate main destination folder since we need its _id to be in the trigger properties
        // this is the role of the Launcher to do it. Let's send a specific error message for the Launcher to do it itself and update the trigger
        throw new Error('MAIN_FOLDER_REMOVED')
      }
      try {
        const createdFolderId = await client
          .collection('io.cozy.files')
          .ensureDirectoryExists(finalPath)
        return await createFile({
          client,
          entry,
          options,
          method,
          file,
          dirId: createdFolderId
        })
      } catch (err) {
        if (err.response?.status === 409) {
          this.log('')
          options.log(
            'info',
            'createFileWithFolderOnError',
            `409 when trying to create destination folder, folder was created another way`
          )
        } else {
          throw err
        }
      }
    }
    throw err
  }
}

/**
 *
 * @param {object} options - options object
 * @param {import('cozy-client/types/CozyClient').default} options.client - CozyClient instance
 * @param {saveFilesEntry} options.entry - saveFiles entry
 * @param {saveFileOptions} options.options - saveFiles options
 * @param {'create'|'updateById'} options.method - file creation method which will be used
 * @param {import('cozy-client/types/types').IOCozyFile} options.file - io.cozy.files document
 * @param {string} options.dirId - destination directory id
 * @returns {Promise<import('cozy-client/types/types').IOCozyFile>} - created or updated file document
 */
async function createFile({ client, entry, options, method, file, dirId }) {
  let createFileOptions = {
    name: getFileName(entry, options),
    dirId
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
    const clientResponse = await client.save({
      _id: file._id,
      _rev: file._rev,
      _type: 'io.cozy.files',
      type: 'file',
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
    if (options.validateFile(fileDocument, options) === false) {
      await removeFile(client, fileDocument, options)
      throw new Error('BAD_DOWNLOADED_FILE')
    }
  }

  return fileDocument
}

const defaultShouldReplaceFile = (file, entry, options) => {
  if (!file) return false
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

const shouldReplaceFile = function (file, entry, options) {
  const isValid = !options.validateFile || options.validateFile(file)
  if (!isValid) {
    options.log(
      'warning',
      'shouldReplaceFile',
      `${getFileName(file, options)} is invalid`
    )
    throw new Error('BAD_DOWNLOADED_FILE')
  }
  const shouldReplaceFileFn =
    entry.shouldReplaceFile ||
    options.shouldReplaceFile ||
    defaultShouldReplaceFile

  return shouldReplaceFileFn(file, entry, options)
}

/**
 * Remove the given file
 *
 * @param {import('cozy-client/types/CozyClient').default} client - CozyClient instance
 * @param {import('cozy-client/types/types').FileDocument} file - file to remove
 * @param {saveFileOptions} options - options object
 */
const removeFile = async function (client, file, options) {
  if (!client) {
    options.log('error', 'removeFile', 'No client, impossible to delete file')
  } else {
    await client.collection('io.cozy.files').deleteFilePermanently(file._id)
  }
}

module.exports = saveFiles

/**
 * Get the name of a the file corresponding to the given entry en options
 *
 * @param {saveFilesEntry} entry - saveFiles entry
 * @param {saveFileOptions} options - options object
 * @returns {false|string} - restulting file name
 */
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

/**
 * Check if the size of the file is 0 or not
 *
 * @param {import('cozy-client/types/types').IOCozyFile} fileobject - io.cozy.files document
 * @param {saveFileOptions} options - options object
 * @returns {boolean} - is the file valid or not
 */
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

/**
 * Logs the filestream from an entry without logging the content
 *
 * @param {string|ArrayBuffer|undefined} fileStream - filestream attribute of entry
 * @param {saveFileOptions} options - options object
 * @returns {void}
 */
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

/**
 * Validates if a file document should be kept or not
 *
 * @param {import('cozy-client/types/types').IOCozyFile} fileDocument - io.cozy.files document
 * @param {saveFileOptions} options - options object
 * @returns {boolean} - is the file valid or not
 */
function defaultValidateFile(fileDocument, options) {
  return checkFileSize(fileDocument, options)
}

function sanitizeEntry(entry) {
  delete entry.requestOptions
  delete entry.filestream
  delete entry.shouldReplaceFile
  delete entry.existingFile
  delete entry.shouldReplace
  delete entry.fileAttributes
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
