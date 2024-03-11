const { CookieJar } = require('tough-cookie')

const log = require('cozy-logger').namespace('CookieKonnector')

const BaseKonnector = require('./BaseKonnector')
const requestFactory = require('./request')

const JAR_ACCOUNT_KEY = 'session'

/**
 * @class
 * Connector base class extending BaseKonnector which handles cookie session in a central way
 * It also handles saving cookie session in the account and automatically restore it for the next
 * connector run.
 * All cozy-konnector-libs tools using request are proposed as methods of this class to force them
 * to use the central cookie which can be saved/restored.
 * You need at least the `GET` and `PUT` permissions on `io.cozy.accounts` in your manifest to allow
 * it to save/restore cookies
 * @example
 * ```javascript
 * const { CookieKonnector } = require('cozy-konnector-libs')
 * class MyConnector extends CookieKonnector {
 *   async fetch(fields) {
 *      // the code of your connector
 *      await this.request('https://...')
 *   }
 *   async testSession() {
 *      const $ = await this.request('https://...')
 *      return $('')
 *   }
 * }
 * const connector = new MyKonnector({
 *   cheerio: true,
 *   json: false
 * })
 * connector.run()
 * ```
 */
class CookieKonnector extends BaseKonnector {
  /**
   * Constructor
   *
   * @param  {Function} requestFactoryOptions    - Option object passed to requestFactory to
   * initialize this.request. It is still possible to change this.request doing :
   *
   * ```javascript
   * this.request = this.requestFactory(...)
   * ```
   *
   * Please not you have to run the connector yourself doing :
   *
   * ```javascript
   * connector.run()
   * ```
   */
  constructor(requestFactoryOptions) {
    super()
    if (!this.testSession) {
      throw new Error(
        'Could not find a testSession method. CookieKonnector needs it to test if a session is valid. Please implement it'
      )
    }
    this._jar = requestFactory().jar()
    this.request = this.requestFactory(requestFactoryOptions)
  }

  /**
   * Initializes the current connector with data coming from the associated account
   * and also the session
   *
   * @returns {Promise} with the fields as an object
   */
  async initAttributes(cozyFields, account) {
    await super.initAttributes(cozyFields, account)
    await this.initSession()
  }

  /**
   * Hook called when the connector is ended
   */
  async end() {
    await this.saveSession()
    return super.end()
  }

  /**
   * Calls cozy-konnector-libs requestFactory forcing this._jar as the cookie
   *
   * @param  {object} options - requestFactory option
   * @returns {object} - The resulting request object
   */
  requestFactory(options) {
    this._jar = this._jar || requestFactory().jar()
    return requestFactory({
      ...options,
      jar: this._jar
    })
  }

  /**
   * Reset cookie session with a new empty session and save it to the associated account
   *
   * @returns {Promise} empty promise
   */
  async resetSession() {
    log('debug', 'Reset cookie session...')
    this._jar = requestFactory().jar()
    return this.saveSession()
  }

  /**
   * Get the cookie session from the account if any
   *
   * @returns {Promise} true or false if the session in the account exists or not
   */
  async initSession() {
    const accountData = this.getAccountData()
    try {
      if (this._account.state === 'RESET_SESSION') {
        log('debug', 'RESET_SESSION state found')
        await this.resetSession()
        await this.updateAccountAttributes({ state: null })
      }
    } catch (err) {
      log('warn', 'Could not reset the session')
      log('warn', err.message)
    }

    try {
      let jar = null
      if (accountData && accountData.auth) {
        jar = JSON.parse(accountData.auth[JAR_ACCOUNT_KEY])
      }

      if (jar) {
        log('debug', 'found saved session, using it...')
        this._jar._jar = CookieJar.fromJSON(jar, this._jar._jar.store)
        return true
      }
    } catch (err) {
      log('debug', 'Could not parse session')
    }
    log('debug', 'Found no session')
    return false
  }

  /**
   * Saves the current cookie session to the account
   *
   * @returns {Promise} empty promise
   */
  async saveSession(obj) {
    const accountData = { ...this._account.data, auth: {} }

    if (obj && obj.getCookieJar) {
      this._jar._jar = obj.getCookieJar()
    }

    accountData.auth[JAR_ACCOUNT_KEY] = JSON.stringify(this._jar._jar.toJSON())
    await this.saveAccountData(accountData)
    log('debug', 'saved the session')
  }

  /**
   * This is signin function from cozy-konnector-libs which is forced to use the current cookies
   * and current request from CookieKonnector. It also automatically saves the session after
   * signin if it is a success.
   *
   * @returns {Promise} resolve with an object containing form data
   */
  async signin(options) {
    const result = await super.signin({
      ...options,
      requestInstance: this.request
    })
    await this.saveSession()
    return result
  }

  /**
   * This is saveFiles function from cozy-konnector-libs which is forced to use the current cookies
   * and current request from CookieKonnector.
   *
   * @returns {Promise} resolves with the list of entries with file objects
   */
  saveFiles(entries, fields, options) {
    return super.saveFiles(entries, fields, {
      ...options,
      requestInstance: this.request
    })
  }

  /**
   * This is saveBills function from cozy-konnector-libs which is forced to use the current cookies
   * and current request from CookieKonnector.
   *
   * @returns {Promise} resolves with entries hydrated with db data
   */
  saveBills(entries, fields, options) {
    return super.saveBills(entries, fields, {
      ...options,
      requestInstance: this.request
    })
  }
}

module.exports = CookieKonnector
