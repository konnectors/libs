'use strict'

const cozy = require('./cozyclient')
const log = require('cozy-logger').namespace('BaseKonnector')
const { Secret } = require('cozy-logger')
const manifest = require('./manifest')
const errors = require('../helpers/errors')
const saveBills = require('./saveBills')
const get = require('lodash/get')
const updateOrCreate = require('./updateOrCreate')
const saveIdentity = require('./saveIdentity')
const {
  wrapIfSentrySetUp,
  captureExceptionAndDie
} = require('../helpers/sentry')
const sleep = require('util').promisify(global.setTimeout)

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
  }

  run() {
    return this.init()
      .then(requiredFields => {
        const cozyParameters = JSON.parse(process.env.COZY_PARAMETERS || '{}')
        const prom = this.fetch(requiredFields, cozyParameters)
        if (!prom || !prom.then) {
          log(
            'warn',
            `A promise should be returned from the \`fetch\` function. Here ${prom} was returned`
          )
          throw new Error('`fetch` should return a Promise')
        }
        return prom
      })
      .then(this.end.bind(this))
      .catch(this.fail.bind(this))
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

    // if we have an unexpected error, display the stack trace
    if (!errors[error]) log('warn', JSON.stringify(err.stack))

    this.terminate(error)
  }

  /**
   * Initializes the current connector with data coming from the associated account
   *
   * @return {Promise} with the fields as an object
   */
  init() {
    const cozyFields = JSON.parse(process.env.COZY_FIELDS || '{}')

    // First get the account related to the specified account id
    return cozy.data
      .find('io.cozy.accounts', cozyFields.account)
      .catch(err => {
        this.checkTOS(err)
        log('error', `Account ${cozyFields.account} does not exist`)
        throw new Error('CANNOT_FIND_ACCOUNT')
      })
      .then(account => {
        this.accountId = cozyFields.account
        this._account = account

        // folder ID will be stored in cozyFields.folder_to_save when first connection
        if (!cozyFields.folder_to_save) {
          log('warn', `No folder_to_save available in the trigger`)
        }
        const folderId = cozyFields.folder_to_save || account.folderId
        if (!folderId) {
          // if no folder needed
          log('debug', 'No folder needed')
          return Promise.resolve(account)
        }
        return cozy.files
          .statById(folderId, false)
          .then(folder => {
            cozyFields.folder_to_save = folder.attributes.path
            log('debug', folder, 'folder details')
            return account
          })
          .catch(err => {
            log('error', err.message)
            log('error', JSON.stringify(err.stack))
            log('error', `error while getting the folder path of ${folderId}`)
            throw new Error('NOT_EXISTING_DIRECTORY')
          })
      })
      .then(account => {
        this.fields = Object.assign(
          {},
          account.auth,
          account.oauth,
          cozyFields.folder_to_save
            ? {
                folderPath: cozyFields.folder_to_save
              }
            : {}
        )

        return this.fields
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
   * @param  {object} data    - Attributes to be merged
   * @param  {object} options - { merge: true|false }
   * @return {Promise}
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
   * It uses the account to do the communication with the user
   *
   * Parameters:
   *
   * - `params` object with some mandatory attributes :
   *   + `type` (String): (default email) this is the type of expected 2FA code. The message displayed
   *   to the user will follow it. Possible values: email, sms
   *   + `timeout` (Number): (default 3 minutes after now) time when the function will stop waiting
   *   for a code and fail
   *   + `heartBeat` (Number): (default 5s) how much time is waited between each code check
   *   + `retry` (boolen): (default false) is it a retry. If true, an error message will be
   *   displayed to the user
   * Returns: Promise with sucessfull code if any
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
   *      type: 'email',
   *      timeout: 5 * 60 * 1000
   *    })
   *    // send the code to the targeted site
   * }
   * ```
   */
  async waitForTwoFaCode(params = {}) {
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
      timeout: startTime + 3 * 60 * 1000,
      heartBeat: 5000,
      retry: false
    }
    params = { ...defaultParams, ...params }
    let account = {}
    let state = params.retry ? 'TWOFA_NEEDED_RETRY' : 'TWOFA_NEEDED'
    if (params.type === 'email') state += '.EMAIL'
    if (params.type === 'sms') state += '.SMS'
    log('info', `Setting ${state} state into the current account`)
    await this.updateAccountAttributes({ state, twoFACode: null })

    while (Date.now() < params.timeout && !account.twoFACode) {
      await sleep(params.heartBeat)
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
    log('critical', err)
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
