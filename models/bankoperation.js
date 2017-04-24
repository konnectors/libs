const cozy = require('../cozyclient')
const File = require('./file.js')
const moment = require('moment')
const DOCTYPE = 'io.cozy.bankoperations'

module.exports = {
  displayName: 'Bank Operation',
  all (selector, callback) {
    if (!selector) selector = {date: {'$gt': 0}}

    cozy.data.defineIndex(DOCTYPE, ['date'])
    .then((index) => {
      return cozy.data.query(index, {'selector': selector})
    })
    .then(operations => {
      operations = operations.map(operation => {
        operation.date = moment(operation.date)
        return operation
      })
      callback(null, operations)
    })
    .catch(err => {
      callback(err)
    })
  },
  // Set binary of given file (represented by its id) to the current operation
  setBinaryFromFile (operationId, fileId, callback) {
    File.find(fileId, (err, file) => {
      if (err) return callback(err)

      if (file && file.binary && file.binary.file) {
        let attributes = {
          binary: {
            file: file.binary.file,
            fileName: file.name,
            fileMime: file.mime
          }
        }

        cozy.data.updateAttributes(DOCTYPE, operationId, attributes)
          .then(updated => {
            callback(updated)
          })
          .catch(err => {
            callback(err)
          })
      } else {
        callback(new Error(`No binary for this file ${fileId}`))
      }
    })
  }
}
