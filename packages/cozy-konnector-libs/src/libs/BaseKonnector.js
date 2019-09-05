'use strict'

const cozy = require('./cozyclient')
const log = require('cozy-logger').namespace('BaseKonnector')
const { Secret } = require('cozy-logger')
const manifest = require('./manifest')
const saveBills = require('./saveBills')
const saveFiles = require('./saveFiles')
const get = require('lodash/get')
const updateOrCreate = require('./updateOrCreate')
const saveIdentity = require('./saveIdentity')
const {
  wrapIfSentrySetUp,
  captureExceptionAndDie
} = require('../helpers/sentry')
const sleep = require('util').promisify(global.setTimeout)
const LOG_ERROR_MSG_LIMIT = 32 * 1024 - 1 // to avoid to cut the json long and make it unreadable by the stack
const once = require('lodash/once')

/**
 * @class
 * The class from which all the connectors must inherit.
 * It takes a fetch function in parameter that must return a `Promise`.
 * You need at least the `GET` permission on `io.cozy.accounts` in your manifest to allow it to
 * fetch account information for your connector.
 *
 * @example
 * ```javascript
 * const { BaseKonnector } = require('cozy-konnector-libs')
 *
 * module.exports = new BaseKonnector(function fetch () {
 *  // use this to access the instance of the konnector to
 *  // store any information that needs to be passed to
 *  // different stages of the konnector
 *  return request('http://ameli.fr')
 *    .then(computeReimbursements)
 *    .then(saveBills)
 * })
 * ```
 *
 * @description
 * Its role is twofold :
 *
 * - Make the link between account data and konnector
 * - Handle errors
 *
 * ⚠️  A promise should be returned from the `fetch` function otherwise
 * the konnector cannot know that asynchronous code has been called.
 *
 * ```
 * this.terminate('LOGIN_FAILED')
 * ```
 */
class BaseKonnector {
  /**
   * Constructor
   *
   * @param  {function} fetch    - Function to be run automatically after account data is fetched.
   * This function will be binded to the current connector.
   *
   * If not fetch function is given. The connector will have to handle itself it's own exection and
   * error handling
   */
  constructor(fetch) {
    if (typeof fetch === 'function') {
      this.fetch = fetch.bind(this)
      return this.run()
    }

    this.deactivateAutoSuccessfulLogin = once(
      this.deactivateAutoSuccessfulLogin
    )
  }

  async run() {
    try {
      await this.initAttributes()
      const prom = this.fetch(this.fields, this.parameters)
      if (!prom || !prom.then) {
        log(
          'warn',
          `A promise should be returned from the \`fetch\` function. Here ${prom} was returned`
        )
        throw new Error('`fetch` should return a Promise')
      }

      await this.end.bind(this)
    } catch (err) {
      await this.fail.bind(this)
    }
  }

  /**
   * Hook called when the connector is ended
   */
  end() {
    log('info', 'The connector has been run')
  }

  /**
   * Hook called when the connector fails
   */
  fail(err) {
    log('info', 'Error caught by BaseKonnector')

    const error = err.message || err

    this.terminate(error)
  }

  async getAccount(accountId) {
    try {
      return await cozy.data.find('io.cozy.accounts', accountId)
    } catch (err) {
      this.checkTOS(err)
      log('error', err.message)
      log('error', `Account ${accountId} does not exist`)
      throw new Error('CANNOT_FIND_ACCOUNT')
    }
  }

  async findFolderPath(cozyFields, account) {
    // folderId will be stored in cozyFields.folder_to_save on first run
    if (!cozyFields.folder_to_save) {
      log('warn', `No folder_to_save available in the trigger`)
    }
    const folderId = cozyFields.folder_to_save || account.folderId
    let folderPath
    if (folderId) {
      try {
        const folder = await cozy.files.statById(folderId, false)
        log('debug', folder, 'folder details')
        return folder.attributes.path
      } catch (err) {
        log('error', err.message)
        log('error', JSON.stringify(err.stack))
        log('error', `error while getting the folder path of ${folderId}`)
        throw new Error('NOT_EXISTING_DIRECTORY')
      }
    } else {
      log('debug', 'No folder needed')
    }
  }

  /**
   * Initializes konnector attributes that will be used during its lifetime
   *
   * - this._account
   * - this.fields
   */
  async initAttributes() {
    // Parse environment variables
    const cozyFields = JSON.parse(process.env.COZY_FIELDS || '{}')
    const cozyParameters = JSON.parse(process.env.COZY_PARAMETERS || '{}')

    this.parameters = cozyParameters

    // Set account
    const account = await this.getAccount(cozyFields.account)
    this.accountId = account._id
    this._account = account

    // Set folder
    const folderPath = await this.findFolderPath(cozyFields, account)
    cozyFields.folder_to_save = folderPath
    this.fields = Object.assign(
      {},
      account.auth,
      account.oauth,
      folderPath
        ? {
            folderPath
          }
        : {}
    )
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
   * Don't forget to modify the manifest.konnector file to give the right to write on the
   * `io.cozy.accounts` doctype. The syntax can be : `"permissions": {"accounts": {"type": "io.cozy.accounts"}}` (here we juste removed the verb `GET`)
   *
   * @param  {object} data    - Attributes to be merged
   * @param  {object} options - { merge: true|false }
   * @return {Promise}: resolved with the modified account
   */
  saveAccountData(data, options) {
    options = options || {}
    options.merge = options.merge === undefined ? true : options.merge
    const start = options.merge ? Object.assign({}, this.getAccountData()) : {}
    const newData = Object.assign({}, start, data)
    return this.updateAccountAttributes({ data: newData }).then(
      account => account.data
    )
  }

  /**
   * Get the data saved by saveAccountData
   *
   * @return {object}
   */
  getAccountData() {
    return new Secret(this._account.data || {})
  }

  /**
   * Update account attributes and cache the account
   */
  updateAccountAttributes(attributes) {
    return cozy.data
      .updateAttributes('io.cozy.accounts', this.accountId, attributes)
      .then(account => {
        this._account = account
        return account
      })
  }

  /**
   * Notices that 2FA code is needed and wait for the user to submit it.
   * It uses the account to do the communication with the user.
   *
   * It 
   *
   * @param {String} options.type (default: "email") - Type of the expected 2FA code. The message displayed
   *   to the user will depend on it. Possible values: email, sms
   * @param {Number} options.timeout (default 3 minutes after now) - After this date, the stop will stop waiting and
   * and an error will be shown to the user (deprecated and alias of endTime)
   * @param {Number} options.endTime (default 3 minutes after now) - After this timestamp, the home will stop waiting and
   * and an error will be shown to the user
   * @param {Number} options.heartBeat (default: 5000) - How many milliseconds between each code check
   * @param {Boolean} options.retry (default: false) - Is it a retry. If true, an error message will be
   *   displayed to the user
   * @throws Will throw `USER_ACTION_NEEDED.TWOFA_EXPIRED` if the konnector job is not run manually (we assume that
   * not run manually means that we do not have a graphic interface to fill the required information)
   * @throws Will throw `USER_ACTION_NEEDED.TWOFA_EXPIRED` if 2FA is not filled by the user soon enough
   *
   * @returns {Promise} Contains twoFa code entered by user
   *
   * @example
   *
   * ```javascript
   * const { BaseKonnector } = require('cozy-konnector-libs')
   *
   * module.exports = new BaseKonnector(start)
   *
   * async function start() {
   *    // we detect the need of a 2FA code
   *    const code = this.waitForTwoFaCode({
   *      type: 'email'
   *    })
   *    // send the code to the targeted site
   * }
   * ```
   */
  async waitForTwoFaCode(options = {}) {
    if (process.env.COZY_JOB_MANUAL_EXECUTION !== 'true') {
      log(
        'warn',
        `waitForTwoFaCode: this in not a manual execution. It is not possible to handle 2FA here.`
      )
      throw new Error('USER_ACTION_NEEDED.TWOFA_EXPIRED')
    }

    const startTime = Date.now()
    const defaultParams = {
      type: 'email',
      endTime: startTime + 3 * 60 * 1000,
      heartBeat: 5000,
      retry: false
    }
    options = { ...defaultParams, ...options }
    if (options.timeout) {
      log(
        'warn',
        `The timeout option for waitForTwoFaCode is deprecated. Please use the endTime option now`
      )
      options.endTime = options.timeout
    }
    let account = {}
    let state = options.retry ? 'TWOFA_NEEDED_RETRY' : 'TWOFA_NEEDED'
    if (options.type === 'email') state += '.EMAIL'
    if (options.type === 'sms') state += '.SMS'
    log('info', `Setting ${state} state into the current account`)
    await this.updateAccountAttributes({ state, twoFACode: null })

    while (Date.now() < options.endTime && !account.twoFACode) {
      await sleep(options.heartBeat)
      account = await cozy.data.find('io.cozy.accounts', this.accountId)
      log('info', `current accountState : ${account.state}`)
      log('info', `current twoFACode : ${account.twoFACode}`)
    }

    if (account.twoFACode) {
      await this.updateAccountAttributes({
        state: null,
        twoFACode: null
      })
      return account.twoFACode
    }
    throw new Error('USER_ACTION_NEEDED.TWOFA_EXPIRED')
  }

  /**
   * Tells Cozy-Home that we have successfully logged in.
   * Useful when auto-success has been deactivated.
   * See `deactivateAutoSuccess`
   */
  async notifySuccessfulLogin() {
    log('info', 'Notify Cozy-Home of successful login')
    await this.updateAccountAttributes({
      state: 'LOGIN_SUCCESS'
    })
  }

  /**
   * By default, cozy-home considers that the konnector has successfully logged in
   * when the konnector has run for more than 8s. This is problematic for 2FA since
   * the konnector can sit idle, just waiting for the 2FA to come back.
   *
   * When this method is called, cozy-home is notified and will not consider the
   * absence of error after 8s to be a success. Afterwards, to notify cozy-home when
   * the user has logged in successfully, for example, after the user has entered 2FA
   * codes, it is necessary to call `notifySuccessfulLogin`.
   *
   * Does nothing if called more than once.
   */
  async deactivateAutoSuccessfulLogin() {
    log('info', 'Deactivating auto success for Cozy-Home')
    await this.updateAccountAttributes({ state: 'HANDLE_LOGIN_SUCCESS' })
  }

  /**
   * This is saveBills function from cozy-konnector-libs which automatically adds sourceAccount in
   * metadata of each entry
   *
   * @return {Promise}
   */
  saveBills(entries, fields, options) {
    return saveBills(entries, fields, {
      sourceAccount: this.accountId,
      sourceAccountIdentifier: fields.login,
      ...options
    })
  }

  /**
   * This is saveFiles function from cozy-konnector-libs which automatically adds sourceAccount and
   * sourceAccountIdentifier cozyMetadatas to files
   *
   * @return {Promise}
   */
  saveFiles(entries, fields, options) {
    return saveFiles(entries, fields, {
      sourceAccount: this.accountId,
      sourceAccountIdentifier: fields.login,
      ...options
    })
  }

  /**
   * This is updateOrCreate function from cozy-konnector-libs which automatically adds sourceAccount in
   * metadata of each entry
   *
   * @return {Promise}
   */
  updateOrCreate(entries, doctype, matchingAttributes, options) {
    return updateOrCreate(entries, doctype, matchingAttributes, {
      sourceAccount: this.accountId,
      sourceAccountIdentifier: get(options, 'fields.login'),
      ...options
    })
  }

  /**
   * This is saveIdentity function from cozy-konnector-libs which automatically adds sourceAccount in
   * metadata of each entry
   *
   * @return {Promise}
   */
  saveIdentity(contact, accountIdentifier, options = {}) {
    return saveIdentity(contact, accountIdentifier, {
      sourceAccount: this.accountId,
      sourceAccountIdentifier: accountIdentifier,
      ...options
    })
  }

  /**
   * Send a special error code which is interpreted by the cozy stack to terminate the execution of the
   * connector now
   *
   * @param  {string} message - The error code to be saved as connector result see [docs/ERROR_CODES.md]
   */
  terminate(err) {
    log('critical', String(err).substr(0, LOG_ERROR_MSG_LIMIT))
    captureExceptionAndDie(err)
  }

  checkTOS(err) {
    if (
      err &&
      err.reason &&
      err.reason.length &&
      err.reason[0] &&
      err.reason[0].title === 'TOS Updated'
    ) {
      throw new Error('TOS_NOT_ACCEPTED')
    }
  }

  /**
   * Get cozyMetaData from the context of the connector
   *
   * @param  {object} data - this data will be merged with cozyMetaData
   */
  getCozyMetadata(data) {
    Object.assign(data, {
      sourceAccount: this.accountId
    })
    return manifest.getCozyMetadata(data)
  }
}

wrapIfSentrySetUp(BaseKonnector.prototype, 'run')

module.exports = BaseKonnector
