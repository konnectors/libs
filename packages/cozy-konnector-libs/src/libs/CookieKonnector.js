'use strict'

const log = require('cozy-logger').namespace('CookieKonnector')
const BaseKonnector = require('./BaseKonnector')
const requestFactory = require('./request')
const signin = require('./signin')

const { CookieJar } = require('tough-cookie')
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
 *
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
 *
 */
class CookieKonnector extends BaseKonnector {
  /**
   * Constructor
   *
   * @param  {function} requestFactoryOptions    - Option object passed to requestFactory to
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
   * @return {Promise} with the fields as an object
   */
  async init() {
    const fields = await super.init()
    await this.initSession()
    return fields
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
   * @return {object} - The resulting request object
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
   * @return {Promise}
   */
  async resetSession() {
    log('info', 'Reset cookie session...')
    this._jar = requestFactory().jar()
    return this.saveSession()
  }

  /**
   * Get the cookie session from the account if any
   *
   * @return {Promise} true or false if the session in the account exists or not
   */
  async initSession() {
    const accountData = this.getAccountData()
    try {
      if (this._account.state === 'RESET_SESSION') {
        log('info', 'RESET_SESSION state found')
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
        log('info', 'found saved session, using it...')
        this._jar._jar = CookieJar.fromJSON(jar, this._jar._jar.store)
        return true
      }
    } catch (err) {
      log('info', 'Could not parse session')
    }
    log('info', 'Found no session')
    return false
  }

  /**
   * Saves the current cookie session to the account
   *
   * @return {Promise}
   */
  async saveSession() {
    const accountData = { ...this._account.data, auth: {} }
    accountData.auth[JAR_ACCOUNT_KEY] = JSON.stringify(this._jar._jar.toJSON())
    await this.saveAccountData(accountData)
    log('info', 'saved the session')
  }

  /**
   * This is signin function from cozy-konnector-libs which is forced to use the current cookies
   * and current request from CookieKonnector. It also automatically saves the session after
   * signin if it is a success.
   *
   * @return {Promise}
   */
  async signin(options) {
    const result = await signin({
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
   * @return {Promise}
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
   * @return {Promise}
   */
  saveBills(entries, fields, options) {
    return super.saveBills(entries, fields, {
      ...options,
      requestInstance: this.request
    })
  }
}

module.exports = CookieKonnector
