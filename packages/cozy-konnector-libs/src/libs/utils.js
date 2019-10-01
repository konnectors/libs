/**
 * Small utilities helping to develop konnectors.
 *
 * @module utils
 */
const cozyClient = require('./cozyclient')
const groupBy = require('lodash/groupBy')
const keyBy = require('lodash/keyBy')
const sortBy = require('lodash/sortBy')
const range = require('lodash/range')
const format = require('date-fns/format')

/**
 * This function allows to fetch all documents for a given doctype. It is the fastest to get all
 * documents but without filtering possibilities
 * deprecated by the findAll method from cozyClient
 *
 * Parameters:
 *
 * * `doctype` (string): the doctype from which you want to fetch the data
 *
 */
const fetchAll = async doctype => {
  return cozyClient.data.findAll(doctype)
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
 */
const queryAll = async (doctype, selector, index) => {
  if (!selector) {
    // fetchAll is faster in this case
    return await cozyClient.data.findAll(doctype)
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

/**
 * This function find duplicates in a given doctype, filtered by an optional mango selector
 *
 * Parameters:
 *
 * * `doctype` (string): the doctype from which you want to fetch the data
 * * `selector` (object): (optional) the mango query selector
 * * `options` :
 *    - `keys` (array) : List of keys used to check that two items are the same.
 *    - `index` (optionnal) : Return value returned by `cozy.data.defineIndex`, the default will correspond to all documents of the selected doctype.
 *    - `selector` (optionnal object) : Mango request to get records. Gets all the records by default
 *
 * Returns an object with the following keys:
 * * `toKeep`: this is the list of unique documents that you should keep in db
 * * `toRemove`: this is the list of documents that can remove from db. If this is io.cozy.bills
 * documents, do not forget to clean linked bank operations
 *
 * ```javascript
 * const {toKeep, toRemove} = await findDuplicates('io.cozy.bills', {selector: {vendor: 'Direct Energie'}})
 * ```
 */
const findDuplicates = async (doctype, options) => {
  let hash = null
  if (options.keys) {
    hash = doc =>
      options.keys
        .map(key => {
          let result = doc[key]
          if (key === 'date') result = new Date(result)
          return result
        })
        .join(',')
  } else if (options.hash) {
    hash = options.hash
  } else {
    throw new Error('findDuplicates: you must specify keys or hash option')
  }

  let documents = await queryAll(doctype, options.selector)

  if (doctype === 'io.cozy.bills') {
    // keep the bills with the highest number of operations linked to it
    const operations = await fetchAll('io.cozy.bank.operations')
    documents = sortBillsByLinkedOperationNumber(documents, operations)
  }

  const groups = groupBy(documents, hash)
  const toKeep = []
  const toRemove = []
  for (let key in groups) {
    const group = groups[key]
    toKeep.push(group[0])
    toRemove.push.apply(
      toRemove,
      group.slice(1).map(doc => ({
        ...doc,
        original: group[0]._id
      }))
    )
  }

  return { toKeep, toRemove }
}

const sortBillsByLinkedOperationNumber = (bills, operations) => {
  bills = bills.map(bill => {
    bill.opNb = 0
    return bill
  })
  const billsIndex = keyBy(bills, '_id')
  if (operations)
    operations.forEach(op => {
      if (op.bills)
        op.bills.forEach(billId => {
          const bill = billsIndex[billId]
          if (bill) bill.opNb++
        })
    })
  const sorted = sortBy(Object.values(billsIndex), 'opNb').reverse()
  return sorted
}

/**
 * This is a shortcut to update multiple documents in one call
 *
 * Parameters:
 *
 * * `doctype` (string): the doctype from which you want to fetch the data
 * * `ids` (array): array of ids of documents to update
 * * `transformation` (object): attributes to change with their values
 * * `options` :
 *    - `keys` (array) : List of keys used to check that two items are the same.
 *    - `index` (optionnal) : Return value returned by `cozy.data.defineIndex`, the default will correspond to all documents of the selected doctype.
 *    - `selector` (optionnal object) : Mango request to get records. Gets all the records by default
 *
 * Returns a promise which resolves with all the return values of updateAttributes
 *
 * ```javascript
 * await batchUpdateAttributes('io.cozy.bills', [1, 2, 3], {vendor: 'Direct Energie'})
 * ```
 */
const batchUpdateAttributes = async (doctype, ids, transformation) => {
  const result = []
  for (const id of ids) {
    const updateResult = await cozyClient.data.updateAttributes(
      doctype,
      id,
      transformation
    )
    result.push(updateResult)
  }
  return result
}

/**
 * This is a shortcut to delete multiple documents in one call
 *
 * Parameters:
 *
 * * `doctype` (string): the doctype from which you want to fetch the data
 * * `documents` (array): documents to delete with their ids
 * * `transformation` (object): attributes to change with their values
 * * `options` :
 *    - `keys` (array) : List of keys used to check that two items are the same.
 *    - `index` (optionnal) : Return value returned by `cozy.data.defineIndex`, the default will correspond to all documents of the selected doctype.
 *    - `selector` (optionnal object) : Mango request to get records. Gets all the records by default
 *
 * Returns a promise which resolves with all the return values of updateAttributes
 *
 * Example to remove all the documents for a given doctype
 *
 * ```javascript
 * const documents = await fetchAll('io.cozy.marvel')
 * await batchDelete('io.cozy.marvel', documents)
 * ```
 */
const batchDelete = async (doctype, documents) => {
  const result = []
  for (const doc of documents) {
    const deleteResult = await cozyClient.data.delete(doctype, doc)
    result.push(deleteResult)
  }
  return result
}

/**
 * This function can read the content of a cozy pdf file and output its text
 *
 * Parameters:
 *
 * * `fileId` (string): the id of the file in the cozy
 * * `options` :
 *    - `pages` (array or number) : The list of page you want to interpret
 *
 *
 * You need to add pdfjs-dist package as a dependency to your connector to allow this to work
 *
 * Returns a promise which resolves with an object with the following attributes:
 *    - `text` (string) : The full text of the pdf
 *    - `1` : The full pdfjs data for page 1
 *    - `n` : The full pdfjs data for page n
 *
 * Example:
 *
 * ```javascript
 * const pdfText = (await getPdfText('887ABCFE87687')).text
 * ```
 */
const getPdfText = async (fileId, options = {}) => {
  let pdfjs
  try {
    pdfjs = require('pdfjs-dist')
  } catch (err) {
    throw new Error(
      'pdfjs-dist dependency is missing. Please add it in your package.json'
    )
  }
  const response = await cozyClient.files.downloadById(fileId)
  const buffer = await response.buffer()
  const document = await pdfjs.getDocument(buffer)
  let pages
  if (options.pages) {
    pages = Array.isArray(options.pages) ? options.pages : [options.pages]
  } else {
    pages = range(1, document.numPages + 1)
  }
  const result = { text: '' }
  for (const pageNum of pages) {
    const page = await document.getPage(pageNum)
    const pageItems = (await page.getTextContent()).items
    result.text += pageItems.map(doc => doc.str).join('\n')
    result[pageNum] = pageItems
  }
  return result
}

module.exports = {
  fetchAll,
  queryAll,
  findDuplicates,
  sortBillsByLinkedOperationNumber,
  batchUpdateAttributes,
  batchDelete,
  getPdfText,
  formatDate
}

/**
 * This function convert a Date Object to a ISO date string (2018-07-31)
 *
 * Parameters:
 *
 * * `date` (Date): the id of the file in the cozy
 *
 * Returns a string
 *
 * Example:
 *
 * ```javascript
 * const date = formatFrenchDate(New Date.now())
 * ```
 */
function formatDate(date) {
  return format(date, 'YYYY-MM-DD')
}
