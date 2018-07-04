const log = require('cozy-logger').namespace('cozy-konnector-libs')
const requestFactory = require('./libs/request')
const hydrateAndFilter = require('./libs/hydrateAndFilter')

require('./libs/error')

module.exports = {
  BaseKonnector: require('./libs/BaseKonnector'),
  cozyClient: require('./libs/cozyclient'),
  errors: require('./helpers/errors'),
  log,
  saveFiles: require('./libs/saveFiles'),
  saveBills: require('./libs/saveBills'),
  linkBankOperations: require('./libs/linkBankOperations'),
  addData: require('./libs/addData'),
  hydrateAndFilter,
  htmlToPDF: require('./libs/html2pdf').htmlToPDF,
  createCozyPDFDocument: require('./libs/html2pdf').createCozyPDFDocument,
  filterData: deprecate(
    hydrateAndFilter,
    'Use hydrateAndFilter now. filterData will be removed in cozy-konnector-libs@4'
  ),
  updateOrCreate: require('./libs/updateOrCreate'),
  request: deprecate(
    requestFactory,
    'Use requestFactory instead of request. It will be removed in cozy-konnector-libs@4'
  ),
  requestFactory,
  retry: require('bluebird-retry'),
  wrapIfSentrySetUp: require('./helpers/sentry').wrapIfSentrySetUp,
  Document: require('./libs/document'),
  signin: require('./libs/signin'),
  submitForm: require('./libs/signin'),
  scrape: require('./libs/scrape'),
  mkdirp: require('./libs/mkdirp'),
  normalizeFilename: require('./libs/normalizeFilename')
}

function deprecate(wrapped, message) {
  return function() {
    log('warn', message)
    return wrapped.apply(this, arguments)
  }
}
