require('./libs/error')

const requestFactory = require('./libs/request')
const log = require('./libs/logger').namespace('cozy-konnector-libs')

module.exports = {
  BaseKonnector: require('./libs/BaseKonnector'),
  cozyClient: require('./libs/cozyclient'),
  errors: require('./helpers/errors'),
  log,
  saveFiles: require('./libs/saveFiles'),
  saveBills: require('./libs/saveBills'),
  linkBankOperations: require('./libs/linkBankOperations'),
  addData: require('./libs/addData'),
  hydrateAndFilter: require('./libs/hydrateAndFilter'),
  filterData: deprecate(hydrateAndFilter, 'Use hydrateAndFilter now. filterData will be removed in cozy-konnector-libs@4',
  updateOrCreate: require('./libs/updateOrCreate'),
  request: deprecate(requestFactory, 'Use requestFactory instead of request. It will be removed in cozy-konnector-libs@4'),
  requestFactory,
  retry: require('bluebird-retry')
}

function deprecate (wrapped, message) {
  return function () {
    log('warn', message)
    return wrapped.apply(this, arguments)
  }
}
