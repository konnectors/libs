/**
 * Used not to duplicate data.
 *
 * `options`:
 * - `index` : As returned by `cozy.data.defineIndex`. Default corresponds
 *   to all documents of the selected doctype
 * - `selector` : Mango query. Default one is `{selector: {_id: {"$gt": null}}}` to
 *    get all the records.
 * - `keys` : List of keys used to check that two items are the same. Default is `['_id']`
 *
 * @module filterData
 */

const bluebird = require('bluebird')
const log = require('./logger').namespace('hydrateAndFilter')
const get = require('lodash/get')
const uniqBy = require('lodash/uniqBy')

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

const hydrateAndFilter = (entries, doctype, options = {}) => {
  const cozy = require('./cozyclient')

  log('debug', String(entries.length), 'Number of items before hydrateAndFilter')
  if (!doctype) return Promise.reject(new Error(`Doctype is mandatory to filter the connector data.`))

  const keys = options.keys ? options.keys : ['_id']
  const store = {}

  log('debug', keys, 'keys')

  const createHash = item => {
    return keys.map(key => {
      let result = get(item, key)
      if (key === 'date') result = new Date(result)
      return result
    }).join('####')
  }

  const getIndex = () => {
    const index = options.index ? options.index : cozy.data.defineIndex(doctype, keys)
    return index
  }

  const getItems = index => {
    log('debug', index, 'index')

    const selector = options.selector ? options.selector : keys.reduce((memo, key) => {
      memo[key] = {'$gt': null}
      return memo
    }, {})

    log('debug', selector, 'selector')

    return cozy.data.query(index, {selector})
  }

  const populateStore = store => dbitems => {
    dbitems.forEach(dbitem => {
      store[createHash(dbitem)] = dbitem
    })
  }

  // We add `_id` to `entries` that we find in the database.
  // This is useful when linking with bank operations (a bill
  // can already be in the database but not already matched
  // to an operation) since the linking operation need the _id
  // of the entry
  const hydrateExistingEntries = store => () => {
    entries.forEach(entry => {
      const key = createHash(entry)
      if (store[key]) {
        entry._id = store[key]._id
        entry._rev = store[key]._rev
      }
    })
    return entries
  }

  const defaultShouldSave = () => true
  const defaultShouldUpdate = existing => false

  const filterEntries = store => async () => {
    // Filter out items according to shouldSave / shouldUpdate.
    // Both can be passed as option or can be part of the entry.
    return uniqBy(await bluebird.filter(entries, entry => {
      const shouldSave = entry.shouldSave || options.shouldSave || defaultShouldSave
      const shouldUpdate = entry.shouldUpdate || options.shouldUpdate || defaultShouldUpdate
      const existing = store[createHash(entry)]
      if (existing) {
        return suitableCall(shouldUpdate, entry, existing)
      } else {
        return suitableCall(shouldSave, entry)
      }
    }), entry => (entry && entry._id) || entry)
  }

  const formatOutput = entries => {
    log('debug', String(entries.length), 'Number of items after hydrateAndFilter')
    // filter out wrong entries
    return entries.filter(entry => entry)
  }

  return getIndex()
    .then(getItems)
    .then(populateStore(store))
    .then(hydrateExistingEntries(store))
    .then(filterEntries(store))
    .then(formatOutput)
}

module.exports = hydrateAndFilter
