/**
 * The goal of this function is to save the given files in the given folder via the Cozy API.
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
 *   + `timeout` (timestamp) can be used if your connector
 *   needs to fetch a lot of files and if the the stack does not give enough time to your connector to
 *   fetch it all. It could happen that the connector is stopped right in the middle of the download of
 *   the file and the file will be broken. With the `timeout` option, the `saveFiles` function will check
 *   if the timeout has passed right after downloading each file and then will be sure to be stopped
 *   cleanly if the timeout is not too long. And since it is really fast to check that a file has
 *   already been downloaded, on the next run of the connector, it will be able to download some more
 *   files, and so on. If you want the timeout to be in 10s, do `Date.now() + 10*1000`. You can try it in the previous code.
 *
 * @module saveFiles
 */
const bluebird = require('bluebird')
const path = require('path')
const request = require('./request')
const rq = request()
const log = require('./logger').namespace('saveFiles')
const cozy = require('./cozyclient')
const mimetypes = require('mime-types')

const sanitizeEntry = function (entry) {
  delete entry.requestOptions
  return entry
}

const downloadEntry = function (entry, folderPath) {
  const reqOptions = Object.assign(
    {
      uri: entry.fileurl,
      method: 'GET',
      jar: true
    },
    entry.requestOptions
  )
  return cozy.files
    .statByPath(folderPath)
    .then(folder => {
      return cozy.files.create(rq(reqOptions), {
        name: getFileName(entry),
        dirID: folder._id
      })
    })
    .then(fileobject => {
      checkMimeWithPath(fileobject.attributes.mime, fileobject.attributes.name)
      checkFileSize(fileobject)
      return fileobject
    })
    .then(fileobject => {
      entry.fileobject = fileobject
      return entry
    })
}

const saveEntry = function (entry, options) {
  if (!entry.fileurl && !entry.requestOptions) return entry

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
        return cozy.files.trashById(file._id)
        .then(() => Promise.reject(new Error('BAD_DOWNLOADED_FILE')))
      }
    })
    .then(() => true, () => false)
    .then(fileExists => {
      if (fileExists) {
        return entry
      } else {
        log('debug', entry)
        log('debug', `File ${filepath} does not exist yet or is not valid`)
        return downloadEntry(entry, options.folderPath)
      }
    })
    .then(sanitizeEntry)
    .then(entry => {
      return options.postProcess ? options.postProcess(entry) : entry
    })
    .catch(err => {
      log(
        'error',
        err.message,
        `Error caught while trying to save the file ${entry.fileurl}`
      )
      return entry
    })
}

// Saves the files given in the fileurl attribute of each entries
module.exports = (entries, fields, options = {}) => {
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
    timeout: options.timeout,
    postProcess: options.postProcess
  }
  return bluebird
    .mapSeries(entries, entry => saveEntry(entry, saveOptions))
    .catch(err => {
      // do not count TIMEOUT error as an error outside
      if (err.message !== 'TIMEOUT') throw err
    })
}

function getFileName (entry) {
  let filename
  if (entry.filename) {
    filename = entry.filename
  } else {
    // try to get the file name from the url
    const parsed = require('url').parse(entry.fileurl)
    filename = path.basename(parsed.pathname)
  }
  return sanitizeFileName(filename)
}

function sanitizeFileName (filename) {
  return filename.replace(/^\.+$/, '').replace(/[/?<>\\:*|":]/g, '')
}

function checkFileSize (fileobject) {
  if (fileobject.attributes.size === 0) {
    log('warn', `${fileobject.attributes.name} is empty`)
    log('warn', 'BAD_FILE_SIZE')
    return false
  }
  return true
}

function checkMimeWithPath (mime, filepath) {
  const extension = path.extname(filepath).substr(1)
  if (extension && mime && mimetypes.lookup(extension) !== mime) {
    log('warn', `${filepath} and ${mime} do not correspond`)
    log('warn', 'BAD_MIME_TYPE')
    return false
  }
  return true
}
