const bluebird = require('bluebird')
const path = require('path')
const cozy = require('./cozyclient')
const request = require('request')
const log = require('./logger')

// Saves the files given in the fileurl attribute of each entries
module.exports = (entries, folderPath) => {
  return bluebird.mapSeries(entries, entry => {
    log('debug', entry)
    if (!entry.fileurl && !entry.requestOptions) return false

    const filepath = path.join(folderPath, getFileName(entry))
    return cozy.files.statByPath(filepath)
    .then(() => {
      // the file is already present then get out of here
      return entry
    })
    .catch(err => {
      log('info', `File ${filepath} does not exist yet`, err.message)
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
        return cozy.files.create(request(options), {name: getFileName(entry), dirID: folder._id})
        .then(fileobject => {
          entry.fileobject = fileobject
          return entry
        })
      })
    })
    .catch(err => {
      log('error', err.message, `Error cached while trying to save the file ${entry.fileurl}`)
      return entry
    })
  })
  .then(result => {
    // only output newly created files
    return result.filter(item => item.fileobject)
  })
}

function getFileName (entry) {
  if (entry.filename) return entry.filename

  // try to get the file name from the url
  const parsed = require('url').parse(entry.fileurl)
  return path.basename(parsed.pathname)
}
