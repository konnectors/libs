/**
 * The goal of this function is to save the given files in the given folder via the Cozy API.
 * You need the full permission on `io.cozy.files` in your manifest to use this function.
 *
 * - `files` is an array of `{ fileurl, filename }` :
 *
 *   + fileurl: The url of the file. This attribute is mandatory or
 *     this item will be ignored
 *   + filename : The file name of the item written on disk. This attribute is optional and as default value, the
 *     file name will be "smartly" guessed by the function. Use this attribute if the guess is not smart
 *   enough for you.
 *
 * - `folderPath` (string) is relative to the main path given by the `cozy-collect` application to the connector. If the connector is run
 * in standalone mode, the main path is the path of the connector.
 *
 * - `options` (object) is optional. Possible options :
 *
 *   + `timeout` (timestamp) can be used if your connector needs to fetch a lot of files and if the
 *   stack does not give enough time to your connector to fetch it all. It could happen that the
 *   connector is stopped right in the middle of the download of the file and the file will be
 *   broken. With the `timeout` option, the `saveFiles` function will check if the timeout has
 *   passed right after downloading each file and then will be sure to be stopped cleanly if the
 *   timeout is not too long. And since it is really fast to check that a file has already been
 *   downloaded, on the next run of the connector, it will be able to download some more
 *   files, and so on. If you want the timeout to be in 10s, do `Date.now() + 10*1000`.
 *   You can try it in the previous code.
 *
 * @module saveFiles
 */
const bluebird = require('bluebird')
const path = require('path')
const requestFactory = require('./request')
const omit = require('lodash/omit')
const log = require('cozy-logger').namespace('saveFiles')
const cozy = require('./cozyclient')
const mimetypes = require('mime-types')
const errors = require('../helpers/errors')
const DEFAULT_TIMEOUT = Date.now() + 4 * 60 * 1000 // 4 minutes by default since the stack allows 5 minutes

const sanitizeEntry = function(entry) {
  delete entry.requestOptions
  delete entry.filestream
  return entry
}

const downloadEntry = function(entry, options) {
  const reqOptions = Object.assign(
    {
      uri: entry.fileurl,
      method: 'GET',
      jar: true
    },
    entry.requestOptions
  )

  const rq = requestFactory({
    json: false,
    cheerio: false
  })
  let filePromise = rq(reqOptions)

  // we have to do this since the result of filePromise is not a stream and cannot be taken by
  // cozy.files.create
  if (options.postProcessFile) {
    return filePromise.then(data => options.postProcessFile(data))
  }
  return filePromise
}

const createFile = function(entry, options) {
  return cozy.files
    .statByPath(options.folderPath)
    .then(folder => {
      const createFileOptions = {
        name: getFileName(entry),
        dirID: folder._id,
        contentType: options.contentType
      }

      const toCreate = entry.filestream || downloadEntry(entry, options)
      return cozy.files.create(toCreate, createFileOptions)
    })
    .then(fileDocument => {
      // This allows us to have the warning message at the first run
      checkMimeWithPath(
        fileDocument.attributes.mime,
        fileDocument.attributes.name
      )
      checkFileSize(fileDocument)
      return fileDocument
    })
}

const attachFileToEntry = function(entry, fileDocument) {
  entry.fileDocument = fileDocument
  return entry
}

const saveEntry = function(entry, options) {
  if (options.timeout && Date.now() > options.timeout) {
    const remainingTime = Math.floor((options.timeout - Date.now()) / 1000)
    log('info', `${remainingTime}s timeout finished for ${options.folderPath}`)
    throw new Error('TIMEOUT')
  }

  const filepath = path.join(options.folderPath, getFileName(entry))
  return cozy.files
    .statByPath(filepath)
    .then(file => {
      // check that the extension and mime type of the existing file in cozy match
      // if this is not the case, we redownload it
      const mime = file.attributes.mime
      if (!checkMimeWithPath(mime, filepath) || !checkFileSize(file)) {
        return cozy.files
          .trashById(file._id)
          .then(() => Promise.reject(new Error('BAD_DOWNLOADED_FILE')))
      }
      return file
    })
    .then(
      file => {
        return file
      },
      () => {
        log('debug', omit(entry, 'filestream'))
        logFileStream(entry.filestream)
        log('debug', `File ${filepath} does not exist yet or is not valid`)
        return createFile(entry, options)
      }
    )
    .then(file => {
      attachFileToEntry(entry, file)
      return entry
    })
    .then(sanitizeEntry)
    .then(entry => {
      return options.postProcess ? options.postProcess(entry) : entry
    })
    .catch(err => {
      if (err.statusCode === 413) {
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
      return entry
    })
}

// Saves the files given in the fileurl attribute of each entries
module.exports = async (entries, fields, options = {}) => {
  if (entries.length === 0) {
    log('warn', 'No file to download')
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
    timeout: options.timeout || DEFAULT_TIMEOUT,
    postProcess: options.postProcess,
    postProcessFile: options.postProcessFile,
    contentType: options.contentType
  }

  const canBeSaved = entry =>
    entry.fileurl || entry.requestOptions || entry.filestream

  const saveableEntries = await bluebird.filter(entries, canBeSaved)

  if (saveableEntries.length === 0) {
    log('warn', 'saveFiles: no file to save')
  }

  let savedFiles = 0
  return bluebird
    .mapSeries(saveableEntries, async entry => {
      entry = await saveEntry(entry, saveOptions)
      savedFiles++
      return entry
    })
    .catch(err => {
      // do not count TIMEOUT error as an error outside
      if (err.message !== 'TIMEOUT') throw err
    })
    .finally(entries => {
      const logType = savedFiles ? 'info' : 'warn'
      log(logType, `saveFiles downloaded ${savedFiles} file(s)`)
      return entries
    })
}

function getFileName(entry) {
  let filename
  if (entry.filename) {
    filename = entry.filename
  } else if (entry.filestream) {
    log('debug', omit(entry, 'filestream'))
    logFileStream(entry.filestream)
    throw new Error('Missing filename property')
  } else {
    // try to get the file name from the url
    const parsed = require('url').parse(entry.fileurl)
    filename = path.basename(parsed.pathname)
  }
  return sanitizeFileName(filename)
}

function sanitizeFileName(filename) {
  return filename.replace(/^\.+$/, '').replace(/[/?<>\\:*|":]/g, '')
}

function checkFileSize(fileobject) {
  if (fileobject.attributes.size === 0) {
    log('warn', `${fileobject.attributes.name} is empty`)
    log('warn', 'BAD_FILE_SIZE')
    return false
  }
  return true
}

function checkMimeWithPath(mime, filepath) {
  const extension = path.extname(filepath).substr(1)
  if (extension && mime && mimetypes.lookup(extension) !== mime) {
    log('warn', `${filepath} and ${mime} do not correspond`)
    log('warn', 'BAD_MIME_TYPE')
    return false
  }
  return true
}

function logFileStream(fileStream) {
  if (!fileStream) return

  if (fileStream && fileStream.constructor && fileStream.constructor.name) {
    log(
      'info',
      `The fileStream attribute is an instance of ${
        fileStream.constructor.name
      }`
    )
  } else {
    log('info', `The fileStream attribute is a ${typeof fileStream}`)
    // console.log(fileStream)
  }
}
