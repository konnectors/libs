/**
 * Saves the given files in the given folder via the Cozy API.
 *
 * @module saveFiles
 */
const bluebird = require('bluebird')
const retry = require('bluebird-retry')
const mimetypes = require('mime-types')
const path = require('path')
const requestFactory = require('./request')
const omit = require('lodash/omit')
const get = require('lodash/get')
const isEqual = require('lodash/isEqual')
const log = require('cozy-logger').namespace('saveFiles')
const manifest = require('./manifest')
const cozy = require('./cozyclient')
const client = cozy.new
const { Q } = require('cozy-client/dist/queries/dsl')
const { models } = require('cozy-client')
const { Qualification } = models.document
const errors = require('../helpers/errors')
const stream = require('stream')
const fileType = require('file-type')
const ms = 1
const s = 1000 * ms
const m = 60 * s
const DEFAULT_TIMEOUT = Date.now() + 4 * m // 4 minutes by default since the stack allows 5 minutes
const DEFAULT_CONCURRENCY = 1
const DEFAULT_RETRY = 1 // do not retry by default
const FILES_DOCTYPE = 'io.cozy.files'

/**
 * Saves the files given in the fileurl attribute of each entries
 *
 * You need the full permission on `io.cozy.files` in your manifest to use this function.
 *
 * @param {Array} entries - list of object describing files to save
 * @param {string} entries.fileurl - The url of the file (can be a function returning the value). Ignored if `filestream` is given
 * @param {Function} entries.fetchFile - the connector can give it's own function to fetch the file from the website, which will be run only when necessary (if the corresponding file is missing on the cozy) function returning the stream). This function must return a promise resolved as a stream
 * @param {object | string} entries.filestream - the stream which will be directly passed to cozyClient.files.create (can also be function returning the stream)
 * @param {object} entries.requestOptions - The options passed to request to fetch fileurl (can be a function returning the value)
 * @param {string} entries.filename - The file name of the item written on disk. This attribute is optional and as default value, the file name will be "smartly" guessed by the function. Use this attribute if the guess is not smart enough for you, or if you use `filestream` (can be a function returning the value).
 * @param {string} entries.shouldReplaceName - used to migrate filename. If saveFiles finds a file linked to this entry and this file name matches `shouldReplaceName`, the file is renamed to `filename` (can be a function returning the value)
 * @param {Function} entries.shouldReplaceFile - use this function to state if the current entry should be forced to be redownloaded and replaced. Usefull if we know the file content can change and we always want the last version.
 * @param {object} entries.fileAttributes - ex: `{created_at: new Date()}` sets some additionnal file attributes passed to cozyClient.file.create
 * @param {string} entries.subPath - A subpath to save all files, will be created if needed.
 * @param {object} fields - is the argument given to the main function of your connector by the BaseKonnector.  It especially contains a `folderPath` which is the string path configured by the user in collect/home
 * @param {object} options - global options
 * @param {number} options.timeout - timestamp which can be used if your connector needs to fetch a lot of files and if the stack does not give enough time to your connector to fetch it all. It could happen that the connector is stopped right in the middle of the download of the file and the file will be broken. With the `timeout` option, the `saveFiles` function will check if the timeout has passed right after downloading each file and then will be sure to be stopped cleanly if the timeout is not too long. And since it is really fast to check that a file has already been downloaded, on the next run of the connector, it will be able to download some more files, and so on. If you want the timeout to be in 10s, do `Date.now() + 10*1000`.  You can try it in the previous code.
 * @param {number|boolean} options.contentType - ex: 'application/pdf' used to force the contentType of documents when they are badly recognized by cozy. If "true" the content type will be recognized from the file name and forced the same way.
 * @param {number} options.concurrency - default: `1` sets the maximum number of concurrent downloads
 * @param {Function} options.validateFile - default: do not validate if file is empty or has bad mime type
 * @param {boolean|Function} options.validateFileContent - default false. Also check the content of the file to recognize the mime type
 * @param {Array} options.fileIdAttributes - array of strings : Describes which attributes of files will be taken as primary key for files to check if they already exist, even if they are moved. If not given, the file path will used for deduplication as before.
 * @param {string} options.subPath - A subpath to save this file, will be created if needed.
 * @param {Function} options.fetchFile - the connector can give it's own function to fetch the file from the website, which will be run only when necessary (if the corresponding file is missing on the cozy) function returning the stream). This function must return a promise resolved as a stream
 * @example
 * ```javascript
 * await saveFiles([{fileurl: 'https://...', filename: 'bill1.pdf'}], fields, {
 *    fileIdAttributes: ['fileurl']
 * })
 * ```
 * @alias module:saveFiles
 */
const saveFiles = async (entries, fields, options = {}) => {
  if (!entries || entries.length === 0) {
    log('warn', 'No file to download')
  }
  if (!options.sourceAccount) {
    log('warn', 'There is no sourceAccount given to saveFiles')
  }

  if (!options.sourceAccountIdentifier) {
    log('warn', 'There is no sourceAccountIdentifier given to saveFiles')
  }
  if (typeof fields !== 'object') {
    log(
      'debug',
      'Deprecation warning, saveFiles 2nd argument should not be a string'
    )
    fields = {
      folderPath: fields
    }
  }
  const saveOptions = {
    folderPath: fields.folderPath,
    fileIdAttributes: options.fileIdAttributes,
    timeout: options.timeout || DEFAULT_TIMEOUT,
    concurrency: options.concurrency || DEFAULT_CONCURRENCY,
    retry: options.retry || DEFAULT_RETRY,
    postProcess: options.postProcess,
    postProcessFile: options.postProcessFile,
    contentType: options.contentType,
    requestInstance: options.requestInstance,
    shouldReplaceFile: options.shouldReplaceFile,
    validateFile: options.validateFile || defaultValidateFile,
    subPath: options.subPath,
    sourceAccountOptions: {
      sourceAccount: options.sourceAccount,
      sourceAccountIdentifier: options.sourceAccountIdentifier
    }
  }

  if (options.validateFileContent) {
    if (options.validateFileContent === true) {
      saveOptions.validateFileContent = defaultValidateFileContent
    } else if (typeof options.validateFileContent === 'function') {
      saveOptions.validateFileContent = options.validateFileContent
    }
  }

  noMetadataDeduplicationWarning(saveOptions)

  const canBeSaved = entry =>
    entry.fetchFile || entry.fileurl || entry.requestOptions || entry.filestream

  let filesArray = undefined
  let savedFiles = 0
  const savedEntries = []
  try {
    await bluebird.map(
      entries,
      async entry => {
        ;[
          'fileurl',
          'filename',
          'shouldReplaceName',
          'requestOptions'
          // 'filestream'
        ].forEach(key => {
          if (entry[key])
            entry[key] = getValOrFnResult(entry[key], entry, options)
        })
        if (entry.filestream && !entry.filename) {
          log(
            'warn',
            'Missing filename property for for filestream entry, entry is ignored'
          )
          return
        }
        if (entry.shouldReplaceName) {
          // At first encounter of a rename, we set the filenamesList
          if (filesArray === undefined) {
            log('debug', 'initialize files list for renamming')
            filesArray = await getFiles(fields.folderPath)
          }
          const fileFound = filesArray.find(
            f => getAttribute(f, 'name') === entry.shouldReplaceName
          )

          if (fileFound) {
            await renameFile(fileFound, entry)
            // we continue because saveFile mays also add fileIdAttributes to the renamed file
          }

          delete entry.shouldReplaceName
        }

        if (canBeSaved(entry)) {
          const folderPath = await getOrCreateDestinationPath(
            entry,
            saveOptions
          )
          entry = await saveEntry(entry, { ...saveOptions, folderPath })
          if (entry && entry._cozy_file_to_create) {
            savedFiles++
            delete entry._cozy_file_to_create
          }
        }
        savedEntries.push(entry)
      },
      { concurrency: saveOptions.concurrency }
    )
  } catch (err) {
    if (err.message !== 'TIMEOUT') {
      throw err
    } else {
      log(
        'warn',
        `saveFile timeout: still ${entries.length - savedEntries.length} / ${
          entries.length
        } to download`
      )
    }
  }

  log(
    'info',
    `saveFiles created ${savedFiles} files for ${
      savedEntries ? savedEntries.length : 'n'
    } entries`
  )
  return savedEntries
}

const saveEntry = async function (entry, options) {
  if (options.timeout && Date.now() > options.timeout) {
    const remainingTime = Math.floor((options.timeout - Date.now()) / s)
    log('info', `${remainingTime}s timeout finished for ${options.folderPath}`)
    throw new Error('TIMEOUT')
  }

  let file = await getFileIfExists(entry, options)
  let shouldReplace = false
  if (file) {
    try {
      shouldReplace = await shouldReplaceFile(file, entry, options)
    } catch (err) {
      log('info', `Error in shouldReplaceFile : ${err.message}`)
      shouldReplace = true
    }
  }

  let method = 'create'

  if (shouldReplace && file) {
    method = 'updateById'
    log('debug', `Will replace ${getFilePath({ options, file })}...`)
  }

  try {
    if (!file || method === 'updateById') {
      log('debug', omit(entry, 'filestream'))
      logFileStream(entry.filestream)
      log(
        'debug',
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
        args: [entry, options, method, file]
      }).catch(err => {
        if (err.message === 'BAD_DOWNLOADED_FILE') {
          log(
            'warn',
            `Could not download file after ${options.retry} tries removing the file`
          )
        } else {
          log('warn', 'unknown file download error: ' + err.message)
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
      throw new Error(errors.DISK_QUOTA_EXCEEDED)
    }
    log('warn', errors.SAVE_FILE_FAILED)
    log(
      'warn',
      err.message,
      `Error caught while trying to save the file ${
        entry.fileurl ? entry.fileurl : entry.filename
      }`
    )
  }
  return entry
}

function noMetadataDeduplicationWarning(options) {
  const fileIdAttributes = options.fileIdAttributes
  if (!fileIdAttributes) {
    log(
      'warn',
      `saveFiles: no deduplication key is defined, file deduplication will be based on file path`
    )
  }

  const slug = manifest.data.slug
  if (!slug) {
    log(
      'warn',
      `saveFiles: no slug is defined for the current connector, file deduplication will be based on file path`
    )
  }

  const sourceAccountIdentifier = get(
    options,
    'sourceAccountOptions.sourceAccountIdentifier'
  )
  if (!sourceAccountIdentifier) {
    log(
      'warn',
      `saveFiles: no sourceAccountIdentifier is defined in options, file deduplication will be based on file path`
    )
  }
}

async function getFileIfExists(entry, options) {
  const fileIdAttributes = options.fileIdAttributes
  const slug = manifest.data.slug
  const sourceAccountIdentifier = get(
    options,
    'sourceAccountOptions.sourceAccountIdentifier'
  )

  const isReadyForFileMetadata =
    fileIdAttributes && slug && sourceAccountIdentifier
  if (isReadyForFileMetadata) {
    const file = await getFileFromMetaData(
      entry,
      fileIdAttributes,
      sourceAccountIdentifier,
      slug
    )
    if (!file) {
      // no file with correct metadata, maybe the corresponding file already exist in the default
      // path from a previous version of the connector
      return await getFileFromPath(entry, options)
    } else return file
  } else {
    return await getFileFromPath(entry, options)
  }
}

async function getFileFromMetaData(
  entry,
  fileIdAttributes,
  sourceAccountIdentifier,
  slug
) {
  const queryDef = Q(FILES_DOCTYPE)
    .where({
      metadata: { fileIdAttributes: calculateFileKey(entry, fileIdAttributes) },
      cozyMetadata: { createdByApp: slug, sourceAccountIdentifier }
    })
    .indexFields([
      'cozyMetadata.createdByApp',
      'cozyMetadata.sourceAccountIdentifier',
      'metadata.fileIdAttributes'
    ])
    .partialIndex({
      trashed: false
    })
    .limitBy(1000)
  const files = await client.queryAll(queryDef)

  if (files && files[0]) {
    if (files.length > 1) {
      log(
        'warn',
        `Found ${files.length} files corresponding to ${calculateFileKey(
          entry,
          fileIdAttributes
        )}`
      )
    }
    return files[0]
  } else {
    log('debug', 'not found')
    return false
  }
}

async function getFileFromPath(entry, options) {
  try {
    log('debug', `Checking existence of ${getFilePath({ entry, options })}`)
    const result = await client
      .collection(FILES_DOCTYPE)
      .statByPath(getFilePath({ entry, options }))
    return result.data
  } catch (err) {
    log('debug', err.message)
    return false
  }
}

async function createFile(entry, options, method, file) {
  const folder = await client
    .collection(FILES_DOCTYPE)
    .statByPath(options.folderPath)
  let createFileOptions = {
    name: getFileName(entry),
    dirId: folder.data._id
  }
  if (options.contentType) {
    if (options.contentType === true && entry.filename) {
      createFileOptions.contentType = mimetypes.contentType(
        path.extname(entry.filename)
      )
    } else {
      createFileOptions.contentType = options.contentType
    }
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

  let toCreate
  if (entry.filestream) {
    toCreate = entry.filestream
  } else if (entry.fetchFile || options.fetchFile) {
    toCreate = await (entry.fetchFile || options.fetchFile)(entry)
  } else {
    toCreate = downloadEntry(entry, { ...options, simple: false })
  }

  let fileDocument
  if (method === 'create') {
    const toSave = {
      _type: FILES_DOCTYPE,
      type: 'file',
      data: toCreate,
      ...createFileOptions
    }
    const clientResponse = await client.save(toSave)
    fileDocument = clientResponse.data
  } else if (method === 'updateById') {
    log('debug', `replacing file for ${entry.filename}`)
    const toSave = {
      _id: file._id,
      _rev: file._rev,
      _type: FILES_DOCTYPE,
      type: 'file',
      data: toCreate,
      ...createFileOptions
    }
    const clientResponse = await client.save(toSave)
    fileDocument = clientResponse.data
  }

  if (options.validateFile) {
    if ((await options.validateFile(fileDocument)) === false) {
      await removeFile(fileDocument)
      throw new Error('BAD_DOWNLOADED_FILE')
    }

    if (
      options.validateFileContent &&
      !(await options.validateFileContent(fileDocument))
    ) {
      await removeFile(fileDocument)
      throw new Error('BAD_DOWNLOADED_FILE')
    }
  }

  return fileDocument
}

function downloadEntry(entry, options) {
  let filePromise = getRequestInstance(
    entry,
    options
  )(getRequestOptions(entry, options))

  if (options.contentType) {
    // the developper wants to force the contentType of the document
    // we pipe the stream to remove headers with bad contentType from the request
    return filePromise.pipe(new stream.PassThrough())
  }

  // we have to do this since the result of filePromise is not a stream and cannot be taken by
  // cozy.files.create
  if (options.postProcessFile) {
    log(
      'warn',
      'Be carefull postProcessFile option is deprecated. You should use the filestream attribute in each entry instead'
    )
    return filePromise.then(data => options.postProcessFile(data))
  }
  filePromise.catch(err => {
    log('warn', `File download error ${err.message}`)
  })
  return filePromise
}

const shouldReplaceFile = async function (file, entry, options) {
  const isValid = !options.validateFile || (await options.validateFile(file))
  if (!isValid) {
    log(
      'warn',
      `${getFileName({
        file,
        options
      })} is invalid`
    )
    throw new Error('BAD_DOWNLOADED_FILE')
  }
  const defaultShouldReplaceFile = (file, entry) => {
    const shouldForceMetadataAttr = attr => {
      let entryMetadataAttribute = get(entry, `fileAttributes.metadata.${attr}`)
      if (
        attr === 'qualification' &&
        entryMetadataAttribute instanceof Qualification
      ) {
        // If the entry come with a qualification type object we convert it before compare
        entryMetadataAttribute = entryMetadataAttribute.toQualification()
      }
      const result = !isEqual(
        getAttribute(file, `metadata.${attr}`),
        entryMetadataAttribute
      )
      if (result) log('debug', `filereplacement: adding ${attr} metadata`)
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
      shouldForceMetadataAttr('qualification')

    if (result) {
      if (fileHasNoMetadata && entryHasMetadata)
        log('debug', 'filereplacement: metadata to add')
      if (fileHasNoId && !!options.fileIdAttributes)
        log('debug', 'filereplacement: adding fileIdAttributes')
      if (hasSourceAccountIdentifierOption && !fileHasSourceAccountIdentifier)
        log('debug', 'filereplacement: adding sourceAccountIdentifier')
    }

    return result
  }
  const shouldReplaceFileFn =
    entry.shouldReplaceFile ||
    options.shouldReplaceFile ||
    defaultShouldReplaceFile

  return shouldReplaceFileFn(file, entry)
}

const removeFile = async function (file) {
  await client.collection(FILES_DOCTYPE).deleteFilePermanently(file._id)
}

module.exports = saveFiles
module.exports.getFileIfExists = getFileIfExists
module.exports.sanitizeFileName = sanitizeFileName

function getFileName(entry) {
  let filename
  if (entry.filename) {
    filename = entry.filename
  } else if (entry.fileurl) {
    // try to get the file name from the url
    const parsed = require('url').parse(entry.fileurl)
    filename = path.basename(parsed.pathname)
  } else {
    log('error', 'Could not get a file name for the entry')
    return false
  }
  return sanitizeFileName(filename)
}

function sanitizeFileName(filename) {
  return (
    filename
      .replace(/^\.+$/, '')
      .replace(/[/?<>\\:*|":]/g, '')
      // Replace ascii control characters from 00 to 0F
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x0F]/g, '')
  )
}

function checkFileSize(fileobject) {
  const size = getAttribute(fileobject, 'size')
  const name = getAttribute(fileobject, 'name')
  if (size === 0 || size === '0') {
    log('warn', `${name} is empty`)
    log('warn', 'BAD_FILE_SIZE')
    return false
  }
  return true
}

function checkMimeWithPath(fileDocument) {
  const mime = getAttribute(fileDocument, 'mime')
  const name = getAttribute(fileDocument, 'name')
  const extension = path.extname(name).substr(1)
  if (extension && mime && mimetypes.lookup(extension) !== mime) {
    log('warn', `${name} and ${mime} do not correspond`)
    log('warn', 'BAD_MIME_TYPE')
    return false
  }
  return true
}

function logFileStream(fileStream) {
  if (!fileStream) return

  if (fileStream && fileStream.constructor && fileStream.constructor.name) {
    log(
      'debug',
      `The fileStream attribute is an instance of ${fileStream.constructor.name}`
    )
  } else {
    log('debug', `The fileStream attribute is a ${typeof fileStream}`)
  }
}

async function getFiles(folderPath) {
  const dir = await client.collection(FILES_DOCTYPE).statByPath(folderPath)
  const queryDef = Q(FILES_DOCTYPE)
    .where({ dir_id: dir.data._id })
    .indexFields(['dir_id'])
    .limitBy(1000)
  const files = await client.queryAll(queryDef)
  return files
}

async function renameFile(file, entry) {
  if (!entry.filename) {
    throw new Error('shouldReplaceName needs a filename')
  }
  log('debug', `Renaming ${getAttribute(file, 'name')} to ${entry.filename}`)
  try {
    await client.save({ ...file, name: entry.filename })
  } catch (err) {
    if (JSON.parse(err.message).errors.shift().status === '409') {
      log(
        'warn',
        `${entry.filename} already exists. Removing ${getAttribute(
          file,
          'name'
        )}`
      )
      await client.destroy(file)
    }
  }
}

function getErrorStatus(err) {
  try {
    return Number(JSON.parse(err.message).errors[0].status)
  } catch (e) {
    return null
  }
}

function getValOrFnResult(val, ...args) {
  if (typeof val === 'function') {
    return val.apply(val, args)
  } else return val
}

function calculateFileKey(entry, fileIdAttributes) {
  return fileIdAttributes
    .sort()
    .map(key => get(entry, key))
    .join('####')
}

function defaultValidateFile(fileDocument) {
  return checkFileSize(fileDocument) && checkMimeWithPath(fileDocument)
}

async function defaultValidateFileContent(fileDocument) {
  const response = await client
    .collection(FILES_DOCTYPE)
    .fetchFileContentById(fileDocument)
  const mime = getAttribute(fileDocument, 'mime')
  const fileTypeFromContent = await fileType.fromBuffer(await response.buffer())
  if (!fileTypeFromContent) {
    log('warn', `Could not find mime type from file content`)
    return false
  }

  if (!defaultValidateFile(fileDocument) || mime !== fileTypeFromContent.mime) {
    log(
      'warn',
      `Wrong file type from content ${JSON.stringify(fileTypeFromContent)}`
    )
    return false
  }
  return true
}

function sanitizeEntry(entry) {
  delete entry.fetchFile
  delete entry.requestOptions
  delete entry.filestream
  delete entry.shouldReplaceFile
  return entry
}

function getRequestInstance(entry, options) {
  return options.requestInstance
    ? options.requestInstance
    : requestFactory({
        json: false,
        cheerio: false,
        userAgent: true,
        jar: true
      })
}

function getRequestOptions(entry, options) {
  const defaultRequestOptions = {
    uri: entry.fileurl,
    method: 'GET'
  }

  if (!options.requestInstance) {
    // if requestInstance is already set, we suppose that the connecteur want to handle the cookie
    // jar itself
    defaultRequestOptions.jar = true
  }

  return {
    ...defaultRequestOptions,
    ...entry.requestOptions
  }
}

function attachFileToEntry(entry, fileDocument) {
  entry.fileDocument = fileDocument
  return entry
}

function getFilePath({ file, entry, options }) {
  const folderPath = options.folderPath
  if (file) {
    return path.join(folderPath, getAttribute(file, 'name'))
  } else if (entry) {
    return path.join(folderPath, getFileName(entry))
  }
}

function getAttribute(obj, attribute) {
  return get(obj, `attributes.${attribute}`, get(obj, attribute))
}

async function getOrCreateDestinationPath(entry, saveOptions) {
  const subPath = entry.subPath || saveOptions.subPath
  let finalPath = saveOptions.folderPath
  if (subPath) {
    finalPath += '/' + subPath
    await client.collection(FILES_DOCTYPE).createDirectoryByPath(finalPath)
  }
  return finalPath
}
