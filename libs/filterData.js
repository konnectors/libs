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
const log = require('./logger').namespace('filterData')

const filterData = (entries, doctype, options = {}) => {
  const cozy = require('./cozyclient')

  log('debug', String(entries.length), 'Number of items before filterData')
  if (!doctype) return Promise.reject(new Error(`Doctype is mandatory to filter the connector data.`))

  // expected options:
  //  - index : this is return value which returned by cozy.data.defineIndex, the default will
  //  correspond to all document of the selected doctype
  //  - selector : this the mango request : default one will be {selector: {_id: {"$gt": null}}} to
  //  get all the records
  //  - keys : this is the list of keys used to check that two items are the same
  const keys = options.keys ? options.keys : ['_id']
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

  const getEntries = dbitems => {
    // create a hash for each db item
    const hashTable = dbitems.reduce((memo, dbitem) => {
      const hash = createHash(dbitem)
      memo[hash] = dbitem
      return memo
    }, {})

    // filter out existing items
    return bluebird.filter(entries, entry => {
      return !hashTable[createHash(entry)]
    })
  }

  const formatOutput = entries => {
    log('debug', String(entries.length), 'Number of items after filterData')
    // filter out wrong entries
    return entries.filter(entry => entry)
  }

  return getIndex()
    .then(getItems)
    .then(getEntries)
    .then(formatOutput)
}

module.exports = filterData
