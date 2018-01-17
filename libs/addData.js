/**
 * Creates the records in the given doctype.
 *
 * @module addData
 */
const bluebird = require('bluebird')
const log = require('./logger').namespace('addData')

module.exports = (entries, doctype) => {
  const cozy = require('./cozyclient')
  return bluebird.mapSeries(entries, entry => {
    log('debug', entry, 'Adding this entry')
    return cozy.data.create(doctype, entry)
    .then(dbEntry => {
      // also update the original entry _id to allow saveBills' linkBankOperation entries to have
      // an id
      entry._id = dbEntry._id
      return dbEntry
    })
  })
}
