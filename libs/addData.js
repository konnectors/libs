/**
 * This function saves the data into the cozy blindly without check
 *
 * Parameters:
 *
 * * `documents`: an array of objects corresponding to the data you want to save in the cozy
 * * `doctype` (string): the doctype where you want to save data (ex: 'io.cozy.bills')
 *
 * ```javascript
 * const documents = [
 *   {
 *     name: 'toto',
 *     height: 1.8
 *   },
 *   {
 *     name: 'titi',
 *     height: 1.7
 *   }
 * ]
 *
 * return addData(documents, 'io.cozy.height')
 * ```
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
