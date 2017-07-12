const bluebird = require('bluebird')
const path = require('path')
const cozy = require('./cozyclient')
const request = require('request')
const log = require('./logger')

// Saves the files given in the fileurl attribute of each entries
module.exports = (entries, folderPath, options = {}) => {
  const remainingTime = Math.floor((options.timeout - Date.now()) / 1000)
  if (options.timeout) log('info', `${remainingTime}s remaining for ${folderPath}`)

  return bluebird.mapSeries(entries, entry => {
    if (!entry.fileurl && !entry.requestOptions) return false

    if (options.timeout && Date.now() > options.timeout) {
      log('info', `${remainingTime}s timeout finished for ${folderPath}`)
      throw new Error('TIMEOUT')
    }

    const filepath = path.join(folderPath, sanitizeFileName(getFileName(entry)))
    return cozy.files.statByPath(filepath)
    .then(() => {
      // the file is already present then get out of here
      return entry
    })
    .catch(err => {
      log('debug', entry)
      log('debug', `File ${filepath} does not exist yet`, err.message)
      return cozy.files.statByPath(folderPath)
      .then(folder => {
        const options = {
          uri: entry.fileurl,
          method: 'GET',
          jar: true
        }
        if (entry.requestOptions) {
          Object.assign(options, entry.requestOptions)
        }
        return cozy.files.create(request(options), {name: sanitizeFileName(getFileName(entry)), dirID: folder._id})
        .then(fileobject => {
          entry.fileobject = fileobject
          return entry
        })
      })
    })
    .catch(err => {
      // if error is timeout, do not continue
      if (err.message === 'TIMEOUT') throw err
      // console.log(err, 'err')
      log('error', err.message, `Error caught while trying to save the file ${entry.fileurl}`)
      return entry
    })
  })
  .catch(err => {
    // do not count TIMEOUT error as an error outside
    if (err.message !== 'TIMEOUT') throw err
  })
}

function getFileName (entry) {
  if (entry.filename) return entry.filename

  // try to get the file name from the url
  const parsed = require('url').parse(entry.fileurl)
  return path.basename(parsed.pathname)
}

function sanitizeFileName (filename) {
  return filename.replace(/^\.+$/, '').replace(/[/?<>\\:*|":]/g, '')
}
