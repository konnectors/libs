const fs = require('fs').promises
const path = require('path')
const sleep = require('util').promisify(global.setTimeout)

const get = require('lodash/get')
const omit = require('lodash/omit')
const once = require('lodash/once')

const log = require('cozy-logger').namespace('BaseKonnector')
const { Secret } = require('cozy-logger')

const cozy = require('./cozyclient')
const errors = require('./error')
const manifest = require('./manifest')
const saveBills = require('./saveBills')
const saveFiles = require('./saveFiles')
const saveIdentity = require('./saveIdentity').saveIdentity
const signin = require('./signin')
const updateOrCreate = require('./updateOrCreate')
const {
  wrapIfSentrySetUp,
  captureExceptionAndDie
} = require('../helpers/sentry')

const LOG_ERROR_MSG_LIMIT = 32 * 1024 - 1 // to avoid to cut the json long and make it unreadable by the stack

const findFolderPath = async (cozyFields, account) => {
  // folderId will be stored in cozyFields.folder_to_save on first run
  if (!cozyFields.folder_to_save) {
    log('info', `No folder_to_save available in the trigger`)
  }
  const folderId = cozyFields.folder_to_save || account.folderId
  if (folderId) {
    try {
      const folder = await cozy.files.statById(folderId, false)
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

const checkTOS = err => {
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
 * @class
 * The class from which all the connectors must inherit.
 * It takes a fetch function in parameter that must return a `Promise`.
 * You need at least the `GET` permission on `io.cozy.accounts` in your manifest to allow it to
 * fetch account information for your connector.
 *
 * Its role is twofold :
 *
 * - Make the link between account data and konnector
 * - Handle errors
 *
 * ⚠️  A promise should be returned from the `fetch` function otherwise
 * the konnector cannot know that asynchronous code has been called.
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
 */
class BaseKonnector {
  /**
   * Constructor
   *
   * @param  {Function} fetch    - Function to be run automatically after account data is fetched.
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

    errors.attachProcessEventHandlers()
  }

  /**
   * Entrypoint of the konnector
   *
   * - Initializes connector attributes
   * - Awaits this.main
   * - Ensures errors are handled via this.fail
   * - Calls this.end when the main function succeeded
   */
  async run() {
    try {
      log('debug', 'Preparing konnector...')
      await this.initAttributes()
      log('debug', 'Running konnector main...')
      await this.main(this.fields, this.parameters)
      await this.end()
    } catch (err) {
      log('warn', 'Error from konnector')
      await this.fail(err)
    }
  }

  /**
   * Main runs after konnector has been initialized.
   * Errors thrown will be automatically handled.
   *
   * @returns {Promise} - The konnector is considered successful when it resolves
   */
  main() {
    return this.fetch(this.fields, this.parameters)
  }

  /**
   * Hook called when the connector has ended successfully
   */
  end() {
    log('debug', 'The connector has been run')
  }

  /**
   * Hook called when the connector fails
   */
  fail(err) {
    log('debug', 'Error caught by BaseKonnector')

    const error = err.message || err

    this.terminate(error)
  }

  async getAccount(accountId) {
    try {
      return await cozy.data.find('io.cozy.accounts', accountId)
    } catch (err) {
      checkTOS(err)
      log('error', err.message)
      log('error', `Account ${accountId} does not exist`)
      throw new Error('CANNOT_FIND_ACCOUNT')
    }
  }

  /**
   * Read an eventual payload from COZY_PAYLOAD env var, wether it is a JSON string or a reference
   * to a file containing a JSON string
   *
   * @returns Promise<{Object|null}> result of JSON.parse from the JSON string or null if no payload
   */
  async readPayload() {
    const cozyPayload = process.env.COZY_PAYLOAD

    if (cozyPayload == null) {
      return null
    }

    const isFileReference = get(cozyPayload, '[0]') === '@'

    if (isFileReference) {
      const fileName = cozyPayload.substr(1)
      const filePath = path.resolve(__dirname, fileName)
      try {
        const fileContent = await fs.readFile(filePath)
        return JSON.parse(fileContent)
      } catch (err) {
        throw new Error(
          `Error while reading file ${filePath} payload: ${err.message}`
        )
      }
    } else {
      try {
        return JSON.parse(cozyPayload)
      } catch (err) {
        throw new Error('Could not parse JSON in COZY_PAYLOAD: ' + cozyPayload)
      }
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
    const account = cozyFields.account
      ? await this.getAccount(cozyFields.account)
      : {}
    if (!account || !account._id) {
      log('warn', 'No account was retrieved from getAccount')
    }
    this.accountId = account._id
    this._account = new Secret(account)

    // Set folder
    const folderPath = await findFolderPath(cozyFields, account)
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
   * @returns {Promise}: resolved with the modified account
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
   * @returns {object} the account data
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
        this._account = new Secret(account)
        return account
      })
  }

  /**
   * Sets the 2FA state, according to the type passed.
   * Doing so resets the twoFACode field
   *
   * Typically you should not use that directly, prefer to use waitForTwoFaCode since
   * the wait for user input will be handled for you. It is useful though for the "app"
   * type where no user input (inside Cozy) is needed.
   *
   * @param {object}  options - The list of options
   * @param {string}  options.type - Used by the front to show the right message (email/sms/app/app_code)
   * @param {boolean} options.retry - Is this function call a retry ? This changes the resulting message to the user
   */
  async setTwoFAState({ type, retry = false } = {}) {
    let state = retry ? 'TWOFA_NEEDED_RETRY' : 'TWOFA_NEEDED'
    if (type === 'email') {
      state += '.EMAIL'
    } else if (type === 'sms') {
      state += '.SMS'
    } else if (type === 'app_code') {
      state += '.APP_CODE'
    } else if (type === 'app') {
      state += '.APP'
    }
    log('debug', `Setting ${state} state into the current account`)
    await this.updateAccountAttributes({ state, twoFACode: null })
  }

  /**
   * Resets 2FA state when not needed anymore
   */
  async resetTwoFAState() {
    await this.updateAccountAttributes({
      state: null,
      twoFACode: null
    })
  }

  /**
   * Notices that 2FA code is needed and wait for the user to submit it.
   * It uses the account to do the communication with the user.
   *
   * @param {object} options - The list of options
   * @param {string} options.type (default: "email") - Type of the expected 2FA code. The message displayed
   *   to the user will depend on it. Possible values: email, sms
   * @param {number} options.timeout (default 3 minutes after now) - After this date, the stop will stop waiting and
   * and an error will be shown to the user (deprecated and alias of endTime)
   * @param {number} options.endTime (default 3 minutes after now) - After this timestamp, the home will stop waiting and
   * and an error will be shown to the user
   * @param {number} options.heartBeat (default: 5000) - How many milliseconds between each code check
   * @param {boolean} options.retry (default: false) - Is it a retry. If true, an error message will be
   *   displayed to the user
   * @throws Will throw `USER_ACTION_NEEDED.TWOFA_EXPIRED` if the konnector job is not run manually (we assume that
   * not run manually means that we do not have a graphic interface to fill the required information)
   * @throws Will throw `USER_ACTION_NEEDED.TWOFA_EXPIRED` if 2FA is not filled by the user soon enough
   * @returns {Promise} Contains twoFa code entered by user
   * @example
   *
   * ```javascript
   * const { BaseKonnector } = require('cozy-konnector-libs')
   *
   * module.exports = new BaseKonnector(start)

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
    const ms = 1
    const s = 1000 * ms
    const m = 60 * s
    const defaultParams = {
      type: 'email',
      endTime: startTime + 3 * m,
      heartBeat: 5 * s,
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

    await this.setTwoFAState({
      type: options.type,
      retry: options.retry
    })

    while (Date.now() < options.endTime && !account.twoFACode) {
      await sleep(options.heartBeat)
      account = await cozy.data.find('io.cozy.accounts', this.accountId)
      log('debug', `current accountState : ${account.state}`)
      log('debug', `current twoFACode : ${account.twoFACode}`)
    }

    if (account.twoFACode) {
      await this.resetTwoFAState()
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
    log('debug', 'Notify Cozy-Home of successful login')
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
    log('debug', 'Deactivating auto success for Cozy-Home')
    await this.updateAccountAttributes({ state: 'HANDLE_LOGIN_SUCCESS' })
  }

  /**
   * This is saveBills function from cozy-konnector-libs which automatically adds sourceAccount in
   * metadata of each entry
   *
   * @returns {Promise} resolves with entries hydrated with db data
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
   * @returns {Promise} resolves with the list of entries with file objects
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
   * @returns {Promise} resolves to an array of db objects
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
   * @returns {Promise} empty promise
   */
  saveIdentity(contact, accountIdentifier, options = {}) {
    return saveIdentity(contact, accountIdentifier, {
      sourceAccount: this.accountId,
      sourceAccountIdentifier: accountIdentifier,
      ...options
    })
  }

  /**
   * This is signin function from cozy-konnector-libs which automatically adds deactivateAutoSuccessfulLogin
   * and notifySuccessfulLogin calls
   *
   * @returns {Promise} resolve with an object containing form data
   */
  async signin(options = {}) {
    await this.deactivateAutoSuccessfulLogin()
    const result = await signin(omit(options, 'notifySuccessfulLogin'))
    if (options.notifySuccessfulLogin !== false) {
      await this.notifySuccessfulLogin()
    }
    return result
  }

  /**
   * Send a special error code which is interpreted by the cozy stack to terminate the execution of the
   * connector now
   *
   * @param  {string} err - The error code to be saved as connector result see [docs/ERROR_CODES.md]
   * @example
   * ```javascript
   * this.terminate('LOGIN_FAILED')
   * ```
   */
  terminate(err) {
    log('critical', String(err).substr(0, LOG_ERROR_MSG_LIMIT))
    captureExceptionAndDie(err)
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

BaseKonnector.findFolderPath = findFolderPath
BaseKonnector.checkTOS = checkTOS

module.exports = BaseKonnector
