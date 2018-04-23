/**
 * Combines the features of `saveFiles`, `filterData`, `addData` and `linkBankOperations` for a
 * common case: bills.
 * Will create `io.cozy.bills` objects. The default deduplication keys are `['date', 'amount', 'vendor']`.
 * You need the full permission on `io.cozy.bills`, full permission on `io.cozy.files` and also
 * full permission on `io.cozy.bank.operations` in your manifest, to be able to * use this function.
 *
 * Parameters:
 *
 * - `documents` is an array of objects with any attributes :
 * - `fields` (object) this is the first parameter given to BaseKonnector's constructor
 * - `options` is passed directly to `saveFiles`, `hydrateAndFilter`, `addData` and `linkBankOperations`.
 *
 * ```javascript
 * const { BaseKonnector, saveBills } = require('cozy-konnector-libs')
 *
 * module.exports = new BaseKonnector(function fetch (fields) {
 *   const documents = []
 *   // some code which fills documents
 *   return saveBills(documents, fields, {
 *     identifiers: ['vendorj']
 *   })
 * })
 * ```
 *
 * @module  saveBills
 */

const saveFiles = require('./saveFiles')
const hydrateAndFilter = require('./hydrateAndFilter')
const addData = require('./addData')
const linkBankOperations = require('./linkBankOperations')
const DOCTYPE = 'io.cozy.bills'

// Encapsulate the saving of Bills : saves the files, saves the new data, and associate the files
// to an existing bank operation
module.exports = (entries, fields, options = {}) => {
  if (entries.length === 0) return Promise.resolve()

  if (typeof fields === 'string') {
    fields = { folderPath: fields }
  }

  // Deduplicate on this keys
  options.keys = options.keys || ['date', 'amount', 'vendor']

  options.postProcess = function(entry) {
    if (entry.fileDocument) {
      entry.invoice = `io.cozy.files:${entry.fileDocument._id}`
    }
    delete entry.fileDocument
    return entry
  }

  const originalEntries = entries
  return saveFiles(entries, fields, options)
    .then(entries => hydrateAndFilter(entries, DOCTYPE, options))
    .then(entries => addData(entries, DOCTYPE, options))
    .then(entries =>
      linkBankOperations(originalEntries, DOCTYPE, fields, options)
    )
}
