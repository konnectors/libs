/**
 * Saves the data into the cozy blindly without check.
 *
 * @module addData
 */
const bluebird = require('bluebird')
const omit = require('lodash/omit')
const log = require('cozy-logger').namespace('addData')
const { getCozyMetadata } = require('./manifest')

/**
 * Saves the data into the cozy blindly without check.
 *
 * You need at least the `POST` permission for the given doctype in your manifest, to be able to
 * use this function.
 *
 * Parameters:
 *
 * * `documents`: an array of objects corresponding to the data you want to save in the cozy
 * * `doctype` (string): the doctype where you want to save data (ex: 'io.cozy.bills')
 * * `options` (object): option object
 *   + `sourceAccount` (String): id of the source account
 *   + `sourceAccountIdentifier` (String): identifier unique to the account targetted by the connector. It is the login most of the time
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
 * @alias module:addData
 */
const addData = (entries, doctype, options = {}) => {
  const cozy = require('./cozyclient')
  return bluebird.mapSeries(entries, async entry => {
    log('debug', entry, 'Adding this entry')
    const metaEntry = {
      cozyMetadata: getCozyMetadata({
        ...entry.cozyMetadata,
        sourceAccount: options.sourceAccount,
        sourceAccountIdentifier: options.sourceAccountIdentifier
      }),
      ...entry
    }
    const dbEntry = await (metaEntry._id
      ? cozy.data.update(doctype, metaEntry, omit(metaEntry, '_rev'))
      : cozy.data.create(doctype, metaEntry))
    // Also update the original entry _id to allow saveBills'
    // linkBankOperation entries to have an id
    metaEntry._id = dbEntry._id
    return dbEntry
  })
}

module.exports = addData
