/**
 * This function filters the passed array from data already present in the cozy so that there is
 * not duplicated data in the cozy.
 * You need at least the `GET` permission for the given doctype in your manifest, to be able to
 * use this function.
 *
 * Parameters:
 *
 * * `documents`: an array of objects corresponding to the data you want to save in the cozy
 * * `doctype` (string): the doctype where you want to save data (ex: 'io.cozy.bills')
 * * `options` :
 *    - `keys` (array) : List of keys used to check that two items are the same. By default it is set to `['id']'.
 *    - `index` (optionnal) : Return value returned by `cozy.data.defineIndex`, the default will correspond to all documents of the selected doctype.
 *    - `selector` (optionnal object) : Mango request to get records. Default is built from the keys `{selector: {_id: {"$gt": null}}}` to get all the records.
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
 * return filterData(documents, 'io.cozy.height', {
 *   keys: ['name']
 * }).then(filteredDocuments => addData(filteredDocuments, 'io.cozy.height'))
 *
 * ```
 *
 * @module filterData
 */

const bluebird = require('bluebird')
const log = require('cozy-logger').namespace('hydrateAndFilter')
const get = require('lodash/get')
const uniqBy = require('lodash/uniqBy')
const { queryAll } = require('./utils')

/**
 * Since we can use methods or basic functions for
 * `shouldSave` and `shouldUpdate` we pass the
 * appropriate `this` and `arguments`.
 *
 * If `funcOrMethod` is a method, it will be called
 * with args[0] as `this` and the rest as `arguments`
 * Otherwise, `this` will be null and `args` will be passed
 * as `arguments`.
 */
const suitableCall = (funcOrMethod, ...args) => {
  const arity = funcOrMethod.length
  if (arity < args.length) {
    // must be a method
    return funcOrMethod.apply(args[0], args.slice(1))
  } else {
    // must be a function
    return funcOrMethod.apply(null, args)
  }
}

const hydrateAndFilter = (documents = [], doctype, options = {}) => {
  const cozy = require('./cozyclient')

  log(
    'info',
    String(documents.length),
    'Number of items before hydrateAndFilter'
  )
  if (!doctype)
    return Promise.reject(
      new Error(`Doctype is mandatory to filter the connector data.`)
    )

  const keys = options.keys ? options.keys : ['_id']
  const store = {}

  log('debug', keys, 'keys')

  const createHash = item => {
    return keys
      .map(key => {
        let result = get(item, key)
        if (key === 'date') result = new Date(result)
        return result
      })
      .join('####')
  }

  const getIndex = () => {
    const index = options.index
      ? Promise.resolve(options.index)
      : cozy.data.defineIndex(doctype, keys)
    return index
  }

  const getItems = async index => {
    log('debug', index, 'index')

    const selector = options.selector ? options.selector : null

    log('debug', selector, 'selector')

    return await queryAll(doctype, selector, index)
  }

  const populateStore = store => dbitems => {
    dbitems.forEach(dbitem => {
      store[createHash(dbitem)] = dbitem
    })
  }

  // We add _id to `documents` that we find in the database.
  // This is useful when linking with bank operations (a bill
  // can already be in the database but not already matched
  // to an operation) since the linking operation need the _id
  // of the document
  const hydrateExistingEntries = store => () => {
    documents.forEach(document => {
      const key = createHash(document)
      if (store[key]) {
        document._id = store[key]._id
        document._rev = store[key]._rev
      }
    })
    return documents
  }

  const defaultShouldSave = () => true
  const defaultShouldUpdate = existing => false // eslint-disable-line no-unused-vars

  const filterEntries = store => async () => {
    // Filter out items according to shouldSave / shouldUpdate.
    // Both can be passed as option or can be part of the entry.
    return uniqBy(
      await bluebird.filter(documents, entry => {
        const shouldSave =
          entry.shouldSave || options.shouldSave || defaultShouldSave
        const shouldUpdate =
          entry.shouldUpdate || options.shouldUpdate || defaultShouldUpdate
        const existing = store[createHash(entry)]
        if (existing) {
          return suitableCall(shouldUpdate, entry, existing)
        } else {
          return suitableCall(shouldSave, entry)
        }
      }),
      entry => (entry && entry._id) || entry
    )
  }

  const formatOutput = entries => {
    log(
      'info',
      String(entries.length),
      'Number of items after hydrateAndFilter'
    )
    return entries
  }

  return getIndex()
    .then(getItems)
    .then(populateStore(store))
    .then(hydrateExistingEntries(store))
    .then(filterEntries(store))
    .then(entries => entries.filter(Boolean)) // Filter out wrong entries
    .then(formatOutput)
}

module.exports = hydrateAndFilter
