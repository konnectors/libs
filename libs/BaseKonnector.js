'use strict'

const cozy = require('./cozyclient')
const log = require('./logger')

module.exports = class baseKonnector {
  constructor (fetch) {
    if (typeof fetch === 'function') this.fetch = fetch
    this.init()
    .then(requiredFields => this.fetch(requiredFields))
    .then(() => log('info', 'The connector has been run'))
    .catch(err => {
      log('error', err.message || err, 'Error catched by BaseKonnector')
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
      // get the folder path from the folder id and put it in cozyFields.folder_to_save
      return cozy.files.statById(cozyFields.folder_to_save, false)
      .then(folder => {
        cozyFields.folder_to_save = folder.attributes.path
        log('debug', folder, 'folder details')
        return account
      })
      .catch(err => {
        log('error', err, 'error while getting the folder path')
        throw new Error('NOT_EXISTING_DIRECTORY')
      })
    })
    .then(account => {
      log('debug', account, 'account content')
      const requiredFields = Object.assign({
        folderPath: cozyFields.folder_to_save
      }, account.auth, account.oauth)
      return requiredFields
    })
  }
}
