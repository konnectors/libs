/**
 * Combines the features of `saveFiles`, `filterData`, `addData` and  `linkBankOperations`.
 * Will create `io.cozy.bills` objects. The default deduplication keys are
 * `['date', 'amount', 'vendor']`.
 *
 * `options` is passed directly to `saveFiles`, `filterData`, `addData` and `linkBankOperations`.
 *
 *  @module  saveBills
 */

const saveFiles = require('./saveFiles')
const filterData = require('./filterData')
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
  options.keys = ['date', 'amount', 'vendor']

  options.postProcess = function (entry) {
    if (entry.fileobject) {
      entry.invoice = `io.cozy.files:${entry.fileobject._id}`
    }
    delete entry.fileobject
    return entry
  }

  return saveFiles(entries, fields, options)
    .then(entries => filterData(entries, DOCTYPE, options))
    .then(entries => addData(entries, DOCTYPE, options))
    .then(entries => linkBankOperations(entries, DOCTYPE, fields, options))
}
