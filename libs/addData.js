/**
 * Creates the records in the given doctype.
 *
 * @module addData
 */
const bluebird = require('bluebird')
const omit = require('lodash/omit')
const log = require('./logger').namespace('addData')

module.exports = (entries, doctype) => {
  const cozy = require('./cozyclient')
  return bluebird.mapSeries(entries, async entry => {
    log('debug', entry, 'Adding this entry')
    const dbEntry = await (entry._id
      ? cozy.data.update(doctype, entry, omit(entry, '_rev'))
      : cozy.data.create(doctype, entry))
    // Also update the original entry _id to allow saveBills'
    // linkBankOperation entries to have an id
    entry._id = dbEntry._id
    return dbEntry
  })
}
