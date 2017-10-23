'use strict'

const cozy = require('./cozyclient')
const log = require('./logger').namespace('BaseKonnector')
const Secret = require('./Secret')

module.exports = class baseKonnector {
  constructor (fetch) {
    if (typeof fetch === 'function') this.fetch = fetch.bind(this)
    this.init()
    .then(requiredFields => this.fetch(requiredFields))
    .then(() => log('info', 'The connector has been run'))
    .catch(err => {
      log('warn', 'Error caught by BaseKonnector')
      this.terminate(err.message || err)
    })
  }

  init () {
    const cozyFields = JSON.parse(process.env.COZY_FIELDS)
    log('debug', cozyFields, 'cozyFields in fetch')

    // First get the account related to the specified account id
    return cozy.data.find('io.cozy.accounts', cozyFields.account)
    .catch(err => {
      log('error', err)
      log('error', `Account ${cozyFields.account} does not exist`)
      this.terminate('CANNOT_FIND_ACCOUNT')
    })
    .then(account => {
      this.accountId = cozyFields.account
      this._account = account

      // folder ID will be stored in cozyFields.folder_to_save when first connection
      const folderId = account.folderId || cozyFields.folder_to_save
      if (!folderId) { // if no folder needed
        log('debug', 'No folder needed')
        return Promise.resolve(account)
      }
      return cozy.files.statById(folderId, false)
      .then(folder => {
        cozyFields.folder_to_save = folder.attributes.path
        log('debug', folder, 'folder details')
        return account
      })
      .catch(err => {
        log('error', err)
        log('error', `error while getting the folder path of ${folderId}`)
        this.terminate('NOT_EXISTING_DIRECTORY')
      })
    })
    .then(account => {
      // log('debug', account, 'account content')
      const requiredFields = Object.assign(cozyFields.folder_to_save ? {
        folderPath: cozyFields.folder_to_save
      } : {}, account.auth, account.oauth)
      return requiredFields
    })
  }

  /**
   * Saves data to the account that is passed to the konnector.
   * Use it to persist data that needs to be passed to each
   * konnector run.
   *
   * By default, the data is merged to the remote data, use
   * `options.merge = false` to overwrite the data.
   *
   * The data is saved under the `.data` attribute of the cozy
   * account.
   *
   * @param  {[type]} data    - Attributes to be merged
   * @param  {[type]} options - { merge: true|false }
   * @return {[type]}         - Promise
   */
  saveAccountData (data, options) {
    options = options || {}
    options.merge = options.merge === undefined ? true : options.merge
    const start = options.merge ? Object.assign({}, this.getAccountData()) : {}
    const newData = Object.assign({}, start, data)
    return cozy.data.updateAttributes('io.cozy.accounts', this.accountId, {data: newData})
      .then(account => {
        this._account = account
        return account.data
      })
  }

  getAccountData () {
    return new Secret(this._account.data || {})
  }

  /**
   * Send a special which is interpreted by the cozy stack to terminate the execution of the
   * connector now
   *
   * @param  {[type]} message - The error code to be saved as connector result see [doc/ERROR_CODES.md]
   */
  terminate (message) {
    // The error log is also sent to be compatible with older versions of the cozy stack
    // For version of the stack older than 18bcbd5865a46026de6f794f661d83d5d87a3dbf
    log('error', message)
    log('critical', message)
  }
}
