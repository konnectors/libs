const async = require('async')
const moment = require('moment')
const naming = require('./naming')
const Folder = require('./models/folder')
const File = require('./models/file')
const log = require('./logger')
const debug = require('debug')('save_data_and_file')

// Fetcher layer that creates an object in database for each entry. If a field
// named pdfurl is is set on the entry, it downloads the file and creates a Cozy
// File in the folder given in the options object.
//
// It expects to find the list of entries in the "filtered" field. If the
// filtered field is null, it checks for the  "fetched" field.
module.exports = (logger, model, options, tags) => {
  debug(model, 'model')
  debug(options, 'options')
  return function (requiredFields, entries, body, next) {
    const entriesToSave = entries.filtered || entries.fetched
    debug(entriesToSave, 'entriesToSave')
    const path = requiredFields.folderPath

    const normalizedPath = path.charAt(0) === '/'
      ? path : `/${path}`

    debug(normalizedPath, 'path')

    // For each entry...
    return async.eachSeries(entriesToSave, function (entry, callback) {
      debug(entry, 'entry')
      if (entry.date && entry.date.format === undefined) {
        log('info', 'Bill creation aborted')
        return callback(new Error('Moment instance expected for date field'))
      }

      const fileName = naming.getEntryFileName(entry, options)
      debug(fileName, 'fileName')

      function createFileAndSaveData (entry) {
        File.isPresent(`${normalizedPath}/${fileName}`, (err, result, file) => {
          if (err) {
            debug(err, `error while checking if ${normalizedPath}/${fileName} is present`)
            return callback(err)
          }
          if (result === false) {
            const { pdfurl } = entry

            return Folder.mkdirp(normalizedPath, function () {
              if (options.requestoptions) {
                options.requestoptions.entry = entry
              }
              return File.createNew(fileName, normalizedPath, pdfurl, tags, onCreated, options.requestoptions)
            })
          } else {
            onCreated(null, file, entry.pdfurl)
          }
        })
      }

      function onCreated (err, file, url) {
        if (err) {
          log('error', err.message)
          debug(err)
          log('info', `File for ${url} not created.`)
          return callback()
        } else {
          log('info', `File for ${url} created: ${fileName}`)
          // add the file id to the entry
          if (!entry.file) entry.file = file._id
          return saveEntry(entry, url)
        }
      }

      function saveEntry (entry, entryLabel) {
        if ((entry.vendor == null)) {
          if (options.vendor) { entry.vendor = options.vendor }
        }

        // Only update the date format for the bills, to be able to
        // match correctly the bill with operations.
        if (entry.pdfurl != null && entry.date) {
          let dateWithoutTimezone = entry.date.format('YYYY-MM-DD')
          dateWithoutTimezone += 'T00:00:00.000Z'
          entry.date = moment(dateWithoutTimezone)
        }

        // cozy-db will cast the moment instance into a date since
        // moment.valueOf returns a timestamp that new Date() will parse
        return model.create(entry, function (err) {
          if (err) {
            log('error', err.message)
            debug(err)
            log('error', `entry for ${entryLabel} not saved.`)
          } else {
            log('info', `entry for ${entryLabel} saved.`)
          }
          return callback()
        })
      }

      log('info', `import for entry ${entry.pdfurl} started.`)
      if (entry.pdfurl != null) {
        // It creates a file for the PDF.
        return createFileAndSaveData(entry, entry.pdfurl)
      } else {
        // If there is no file link set, it saves only data.
        log('info', `No file to download for ${entry.pdfurl}.`)
        return saveEntry(entry, entry.pdfurl)
      }
    }, function (err) {
      if (err) {
        log('error', err.message)
        debug(err)
        return next()
      }

      const opts = {
        entries: entries.fetched,
        folderPath: normalizedPath,
        nameOptions: options,
        tags,
        model,
        log
      }
      return checkForMissingFiles(opts, () => next())
    })
  }
}

// For each entry, ensure that the corresponding file exists in the Cozy Files
// application. If it doesn't exist, it creates the file by downloading it
// from its url.
function checkForMissingFiles (options, callback) {
  const {entries, folderPath, nameOptions, tags} = options

  return async.eachSeries(entries, function (entry, done) {
    const fileName = naming.getEntryFileName(entry, nameOptions)
    let path = `${folderPath}/${fileName}`

    // Check if the file is there.
    return File.isPresent(path, function (err, isPresent) {
      if (err) {
        log('error', err.message)
        debug(err)
        return done()
      }

      // If it's there, it does nothing.
      if (isPresent || (entry.pdfurl == null)) { return done() }

      // If it's not there, it creates it.
      const url = entry.pdfurl
      path = folderPath

      return Folder.mkdirp(path, () => {
        return File.createNew(fileName, path, url, tags, function (err, file) {
          if (err) {
            log('error', 'An error occured while creating file')
            debug(err)
            log('error', err.message)
          } else {
            done()
          }
        })
      })
    })
  }, err => {
    if (err) {
      debug(err)
      log('error', err.message)
    }
    return callback()
  })
}
