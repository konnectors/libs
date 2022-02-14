const globalFetch = require('node-fetch').default
global.fetch = globalFetch
global.Headers = globalFetch.Headers
module.exports = function injectDevAccount(config) {
  const { BaseKonnector, mkdirp } = require('cozy-konnector-libs')
  const DEFAULT_ROOT_PATH = '/cozy-konnector-dev-root'
  BaseKonnector.prototype.getAccount = async () => {
    return { _id: 'dev-konnector-account-id' }
  }
  BaseKonnector.prototype.initAttributes = async function () {
    await mkdirp(DEFAULT_ROOT_PATH)
    this.fields = {
      ...config.fields,
      folderPath: DEFAULT_ROOT_PATH
    }
  }
  BaseKonnector.prototype.deactivateAutoSuccessfulLogin = async function () {}
  BaseKonnector.prototype.notifySuccessfulLogin = async function () {}
}
