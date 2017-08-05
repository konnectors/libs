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

  Object.assign(options, {
    keys: ['date', 'amount', 'vendor']
  })
  return saveFiles(entries, fields, options)
  .then(entries => filterData(entries, DOCTYPE, options))
  .then(entries => addData(entries, DOCTYPE, options))
  .then(entries => linkBankOperations(entries, DOCTYPE, fields, options))
}
