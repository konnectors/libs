/**
 * This module proposes some small utils regarding connectors
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
const cozyClient = require('./cozyclient')

/**
 * This function allows to fetch all documents for a given doctype. It is the fastest to get all
 * documents but without filtering possibilities
 *
 * Parameters:
 *
 * * `doctype` (string): the doctype from which you want to fetch the data
 *
 * @module utils
 */
const fetchAll = async doctype => {
  const res = await cozyClient.fetchJSON(
    'GET',
    `/data/${doctype}/_all_docs?include_docs=true`
  )

  if (!(res && res.rows)) return []

  return res.rows
    .filter(doc => doc.id.indexOf('_design') === -1)
    .map(doc => doc.doc)
}

/**
 * This function allows to fetch all documents for a given doctype exceeding the 100 limit.
 * It is slower that fetchAll because it fetches the data 100 by 100 but allows to filter the data
 * with a selector and an index
 *
 * Parameters:
 *
 * * `doctype` (string): the doctype from which you want to fetch the data
 * * `selector` (object): the mango query selector
 * * `index` (object): (optional) the query selector index. If not defined, the function will
 * create it's own index with the keys specified in the selector
 *
 *
 * ```javascript
 * const documents = await queryAll('io.cozy.bills', {vendor: 'Direct Energie'})
 * ```
 *
 * @module utils
 */
const queryAll = async (doctype, selector, index) => {
  if (!selector) {
    // fetchAll is faster in this case
    return await fetchAll(doctype)
  }

  if (!index) {
    index = await cozyClient.data.defineIndex(doctype, Object.keys(selector))
  }

  const result = []
  let resp = { next: true }
  while (resp && resp.next) {
    resp = await cozyClient.data.query(index, {
      selector,
      wholeResponse: true,
      skip: result.length
    })
    result.push(...resp.docs)
  }
  return result
}

module.exports = {
  fetchAll,
  queryAll
}
