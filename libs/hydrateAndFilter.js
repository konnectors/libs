/**
 * Used not to duplicate data.
 *
 * * `options` :
 *    - `keys` : List of keys used to check that two items are the same. By default it is set to `['id']'.
 *    - `index` : Return value returned by `cozy.data.defineIndex`, the default will correspond to all documents of the selected doctype.
 *    - `selector` : Mango request to get records. Default is built from the keys `{selector: {_id: {"$gt": null}}}` to get all the records.
 *
 * @module filterData
 */

const bluebird = require('bluebird')
const log = require('./logger').namespace('hydrateAndFilter')

const hydrateAndFilter = (entries, doctype, options = {}) => {
  const cozy = require('./cozyclient')

  log('debug', String(entries.length), 'Number of items before hydrateAndFilter')
  if (!doctype) return Promise.reject(new Error(`Doctype is mandatory to filter the connector data.`))

  // expected options:
  //  - index : this is return value which returned by cozy.data.defineIndex, the default will
  //  correspond to all document of the selected doctype
  //  - selector : this the mango request : default one will be {selector: {_id: {"$gt": null}}} to
  //  get all the records
  //  - keys : this is the list of keys used to check that two items are the same
  const keys = options.keys ? options.keys : ['_id']
  const store = {}

  log('debug', keys, 'keys')

  const createHash = item => {
    return keys.map(key => {
      let result = item[key]
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

  // We add _id to `entries` that we find in the database.
  // This is useful when linking with bank operations (a bill
  // can already be in the database but not already matched
  // to an operation) since the linking operation need the _id
  // of the entry
  const hydrateExistingEntries = store => () => {
    entries.forEach(entry => {
      const key = createHash(entry)
      if (store[key]) {
        entry._id = store[key]._id
      }
    })
    return entries
  }

  const filterEntries = store => () => {
    // filter out existing items
    return bluebird.filter(entries, entry => {
      return !store[createHash(entry)]
    })
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
