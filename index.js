require('./libs/error')

const requestFactory = require('./libs/request')

module.exports = {
  BaseKonnector: require('./libs/BaseKonnector'),
  cozyClient: require('./libs/cozyclient'),
  errors: require('./helpers/errors'),
  log: require('./libs/logger'),
  saveFiles: require('./libs/saveFiles'),
  saveBills: require('./libs/saveBills'),
  linkBankOperations: require('./libs/linkBankOperations'),
  addData: require('./libs/addData'),
  filterData: require('./libs/filterData'),
  updateOrCreate: require('./libs/updateOrCreate'),
  request: requestFactory, // keep the old alias
  requestFactory,
  retry: require('bluebird-retry')
}
