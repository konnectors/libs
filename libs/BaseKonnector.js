'use strict'

const cozy = require('./cozyclient')
const log = require('./logger').namespace('BaseKonnector')

module.exports = class baseKonnector {
  constructor (fetch) {
    if (typeof fetch === 'function') this.fetch = fetch.bind(this)
    this.init()
    .then(requiredFields => this.fetch(requiredFields))
    .then(() => log('info', 'The connector has been run'))
    .catch(err => {
      log('error', err.message || err, 'Error caught by BaseKonnector')
      process.exit(1)
    })
  }

  init () {
    const cozyFields = JSON.parse(process.env.COZY_FIELDS)
    log('debug', cozyFields, 'cozyFields in fetch')

    // First get the account related to the specified account id
    return cozy.data.find('io.cozy.accounts', cozyFields.account)
    .catch(err => {
      console.error(`Account ${cozyFields.account} does not exist`)
      log('error', err, 'error while fetching the account')
      process.exit(0)
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
        log('error', err, 'NOT_EXISTING_DIRECTORY')
        log('debug', err, `error while getting the folder path of ${folderId}`)
        throw new Error('NOT_EXISTING_DIRECTORY')
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

  saveAccountData (data) {
    return cozy.data.updateAttributes('io.cozy.accounts', this.accountId, {data})
      .then(account => account.data)
  }

  getAccountData () {
    return this._account.data || {}
  }
}
