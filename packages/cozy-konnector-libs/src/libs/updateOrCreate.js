/**
 * Creates or updates the given entries according to if they already
 * exist in the cozy or not
 *
 * @module updateOrCreate
 */
const bluebird = require('bluebird')
const log = require('cozy-logger').namespace('updateOrCreate')
const cozy = require('./cozyclient')
const get = require('lodash/get')
const { getCozyMetadata } = require('./manifest')

/**
 * Creates or updates the given entries according to if they already
 * exist in the cozy or not
 *
 * You need the full permission for the given doctype in your manifest, to be able to
 * use this function.
 *
 * `entries` (object array): Documents to save
 * `doctype` (string): Doctype of the documents
 * `matchingAttributes` (string array): attributes in each entry used to check if an entry already exists in the Cozy
 * `options` (object): general option affecting metadata :
 *   + `sourceAccount` (String): id of the source account
 *   + `sourceAccountIdentifier` (String): identifier unique to the account targetted by the connector. It is the login most of the time
 *
 * @alias module:updateOrCreate
 */
const updateOrCreate = (
  entries = [],
  doctype,
  matchingAttributes = [],
  options = {}
) => {
  return cozy.data.findAll(doctype).then(existings =>
    bluebird.mapSeries(entries, entry => {
      const metaEntry = {
        cozyMetadata: getCozyMetadata({
          ...entry.cozyMetadata,
          sourceAccount: options.sourceAccount,
          sourceAccountIdentifier: options.sourceAccountIdentifier
        }),
        ...entry
      }
      // try to find a corresponding existing element
      const toUpdate = existings.find(doc =>
        matchingAttributes.reduce(
          (isMatching, matchingAttribute) =>
            isMatching &&
            get(doc, matchingAttribute) === get(metaEntry, matchingAttribute),
          true
        )
      )

      if (toUpdate) {
        log('debug', 'updating')
        if (toUpdate.cozyMetadata)
          metaEntry.cozyMetadata.createdAt = toUpdate.cozyMetadata.createdAt
        return cozy.data.updateAttributes(doctype, toUpdate._id, metaEntry)
      } else {
        log('debug', 'creating')
        return cozy.data.create(doctype, metaEntry)
      }
    })
  )
}
module.exports = updateOrCreate
