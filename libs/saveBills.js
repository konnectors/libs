const saveFiles = require('./saveFiles')
const filterData = require('./filterData')
const addData = require('./addData')
const linkBankOperations = require('./linkBankOperations')
const DOCTYPE = 'io.cozy.bills'

// Encapsulate the saving of Bills : saves the files, saves the new data, and associate the files
// to an existing bank operation
module.exports = (entries, folderPath, options = {}) => {
  if (entries.length === 0) return Promise.resolve()

  Object.assign(options, {
    keys: ['date', 'amount', 'vendor']
  })
  return saveFiles(entries, folderPath, options)
  .then(entries => filterData(entries, DOCTYPE, options))
  .then(entries => addData(entries, DOCTYPE, options))
  .then(entries => linkBankOperations(entries, DOCTYPE, options))
}
