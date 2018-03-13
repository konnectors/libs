/**
 * The goal of this function is create or update the given entries according to if they already
 * exist in the cozy or not
 * You need the full permission for the given doctype in your manifest, to be able to
 * use this function.
 *
 * Parameters:
 *
 * - `entries` is an array of objects with any attributes :
 * - `doctype` (string) is the cozy doctype where the entries should be saved
 * - `matchingAttributes` (array of strings) is the list of attributes in each entry should be used to check if an entry
 *   is already saved in the cozy
 *
 * @module updateOrCreate
 */
const bluebird = require('bluebird')
const log = require('cozy-logger').namespace('updateOrCreate')
const cozy = require('./cozyclient')

module.exports = (entries = [], doctype, matchingAttributes = []) => {
  log('warn', 'updateOrCreate is deprecated, define shouldSave/shouldUpdate')
  return cozy.data.findAll(doctype)
    .then(existings => bluebird.mapSeries(entries, entry => {
      log('debug', entry)
      // try to find a corresponding existing element
      const toUpdate = existings.find(doc =>
        matchingAttributes.reduce((isMatching, matchingAttribute) =>
          isMatching && doc[matchingAttribute] === entry[matchingAttribute]
        , true)
      )

      if (toUpdate) {
        log('debug', 'upating')
        return cozy.data.updateAttributes(doctype, toUpdate._id, entry)
      } else {
        log('debug', 'creating')
        return cozy.data.create(doctype, entry)
      }
    }))
}
