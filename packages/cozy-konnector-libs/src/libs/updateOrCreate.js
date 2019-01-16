/**
 * Creates or updates the given entries according to if they already
 * exist in the cozy or not
 *
 * @module updateOrCreate
 */
const bluebird = require('bluebird')
const log = require('cozy-logger').namespace('updateOrCreate')
const cozy = require('./cozyclient')

/**
 * Creates or updates the given entries according to if they already
 * exist in the cozy or not
 *
 * You need the full permission for the given doctype in your manifest, to be able to
 * use this function.
 *
 * @param  {Object[]}  entries - Documents to save
 * @param  {String} doctype - Doctype of the documents
 * @param  {String[]}  matchingAttributes - attributes in each entry used to check if an entry already exists in the Cozy
 * @return {Promise}
 *
 * @alias module:updateOrCreate
 */
module.exports = (entries = [], doctype, matchingAttributes = []) => {
  return cozy.data.findAll(doctype).then(existings =>
    bluebird.mapSeries(entries, entry => {
      log('debug', entry)
      // try to find a corresponding existing element
      const toUpdate = existings.find(doc =>
        matchingAttributes.reduce(
          (isMatching, matchingAttribute) =>
            isMatching && doc[matchingAttribute] === entry[matchingAttribute],
          true
        )
      )

      if (toUpdate) {
        log('debug', 'updating')
        return cozy.data.updateAttributes(doctype, toUpdate._id, entry)
      } else {
        log('debug', 'creating')
        return cozy.data.create(doctype, entry)
      }
    })
  )
}
