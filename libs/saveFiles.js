const bluebird = require('bluebird')
const path = require('path')
const request = require('./request')
const rq = request()
const log = require('./logger').namespace('saveFiles')

const sanitizeEntry = function(entry) {
  delete entry.requestOptions
  return entry
}

const downloadEntry = function(entry, folderPath) {
  const cozy = require('./cozyclient')

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
      entry.fileobject = fileobject
      return entry
    })
}

const saveEntry = function(entry, options) {
  const cozy = require('./cozyclient')

  if (!entry.fileurl && !entry.requestOptions) return false

  if (options.timeout && Date.now() > options.timeout) {
    log('info', `${remainingTime}s timeout finished for ${options.folderPath}`)
    throw new Error('TIMEOUT')
  }

  const filepath = path.join(options.folderPath, getFileName(entry))
  return cozy.files
    .statByPath(filepath)
    .then(() => true, () => false)
    .then(fileExists => {
      if (fileExists) {
        return entry
      } else {
        log('debug', entry)
        log('debug', `File ${filepath} does not exist yet`)
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
module.exports = (entries, folderPath, options = {}) => {
  if (typeof fields !== 'object') {
    log(
      'debug',
      'Deprecation warning, saveFiles 2nd argument should be a string'
    )
    folderPath = folderPath.folderPath
  }
  const remainingTime = Math.floor((options.timeout - Date.now()) / 1000)
  const saveOptions = {
    folderPath: folderPath,
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

function getFileName(entry) {
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

function sanitizeFileName(filename) {
  return filename.replace(/^\.+$/, '').replace(/[/?<>\\:*|":]/g, '')
}
