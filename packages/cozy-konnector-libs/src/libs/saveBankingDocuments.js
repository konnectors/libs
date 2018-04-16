/**
 * Combines the features of `saveFiles`, `filterData`, `addData` and `linkBankOperations` for any
 * doctype.
 * Will create `io.cozy.bills` documents by default or any specified doctype.
 * The default deduplication keys are `['date', 'amount', 'vendor']`.
 * You need the full permission on the doctype, full permission on `io.cozy.files` and also
 * full permission on `io.cozy.bank.operations` in your manifest, to be able to use this function.
 *
 * Parameters:
 *
 * - `documents` is an array of objects with any attributes :
 * - `fields` (object) this is the first parameter given to BaseKonnector's constructor
 * - `options` is passed directly to `saveFiles`, `hydrateAndFilter`, `addData` and `linkBankOperations`.
 *      - `doctype` option has `io.cozy.bills`
 *      - `noBanking` option deactivates linkBankOperations. Default value is false.
 *
 * ```javascript
 * const { BaseKonnector, saveBankingDocuments } = require('cozy-konnector-libs')
 *
 * module.exports = new BaseKonnector(function fetch (fields) {
 *   const documents = []
 *   // some code which fills documents
 *   return saveBankingDocuments(documents, fields, {
 *     identifiers: ['vendorj'],
 *     doctype: 'io.cozy.bills'
 *   })
 * })
 * ```
 *
 * @module  saveBankingDocuments
 */

const saveFiles = require('./saveFiles')
const hydrateAndFilter = require('./hydrateAndFilter')
const addData = require('./addData')
const linkBankOperations = require('./linkBankOperations')
const DEFAULT_DOCTYPE = 'io.cozy.bills'

// Encapsulate the saving of Bills : saves the files, saves the new data, and associate the files
// to an existing bank operation
module.exports = (entries, fields, options = {}) => {
  if (entries.length === 0) return Promise.resolve()

  if (typeof fields === 'string') {
    fields = { folderPath: fields }
  }

  options.doctype = options.doctype || DEFAULT_DOCTYPE

  // Deduplicate on this keys
  options.keys = options.keys || ['date', 'amount', 'vendor']

  options.postProcess = function (entry) {
    if (entry.fileDocument) {
      entry.$relationships = entry.$relationships || {}
      entry.$relationships.document = {
        data: {
          _id: entry.fileDocument._id,
          _type: 'io.cozy.files'
        }
      }
    }
    delete entry.fileDocument
    return entry
  }

  const originalEntries = entries
  return saveFiles(entries, fields, options)
    .then(entries => hydrateAndFilter(entries, options.doctype, options))
    .then(entries => addData(entries, options.doctype, options))
    .then(entries => {
      if (!options.noBanking) return entries

      return linkBankOperations(originalEntries, options.doctype, fields, options)
    })
}
