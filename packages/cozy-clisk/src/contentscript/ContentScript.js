// @ts-check
import waitFor from 'p-wait-for'
import Minilog from '@cozy/minilog'

import LauncherBridge from '../bridge/LauncherBridge'
import { blobToBase64 } from './utils'
import ky from 'ky/umd'

const log = Minilog('ContentScript class')

const s = 1000
const m = 60 * s

const DEFAULT_LOGIN_TIMEOUT = 5 * m
const DEFAULT_WAIT_FOR_ELEMENT_TIMEOUT = 30 * s

export const PILOT_TYPE = 'pilot'
export const WORKER_TYPE = 'worker'

sendContentScriptReadyEvent()

export default class ContentScript {
  /**
   * Init the bridge communication with the launcher.
   * It also exposes the methods which will be callable by the launcher
   *
   * @param {object} options : options object
   * @param {Array<string>} [options.additionalExposedMethodsNames] : list of additional method of the
   * content script to expose. To make it callable via the worker.
   */
  async init(options = {}) {
    this.bridge = new LauncherBridge({ localWindow: window })
    const exposedMethodsNames = [
      'setContentScriptType',
      'ensureAuthenticated',
      'checkAuthenticated',
      'waitForAuthenticated',
      'waitForElementNoReload',
      'getUserDataFromWebsite',
      'fetch',
      'click',
      'fillText',
      'storeFromWorker',
      'clickAndWait',
      'getCookiesByDomain',
      'getCookieByDomainAndName',
      'downloadFileInWorker'
    ]

    if (options.additionalExposedMethodsNames) {
      exposedMethodsNames.push.apply(
        exposedMethodsNames,
        options.additionalExposedMethodsNames
      )
    }

    const exposedMethods = {}
    // TODO error handling
    // should catch and call onError on the launcher to let it handle the job update
    for (const method of exposedMethodsNames) {
      exposedMethods[method] = this[method].bind(this)
    }
    this.store = {}
    await this.bridge.init({ exposedMethods })
    window.onbeforeunload = () =>
      this.log(
        'debug',
        `window.beforeunload detected with previous url : ${document.location}`
      )

    this.bridge.emit('workerReady')
  }

  /**
   * Set the ContentScript type. This is usefull to know which webview is the pilot or the worker
   *
   * @param {string} contentScriptType - ("pilot" | "worker")
   */
  async setContentScriptType(contentScriptType) {
    this.contentScriptType = contentScriptType
    log.info(`I am the ${contentScriptType}`)
  }

  /**
   * Check if the user is authenticated or not. This method is made to be overloaded by the child class
   *
   * @returns {Promise.<boolean>} : true if authenticated or false in other case
   */
  async checkAuthenticated() {
    return false
  }

  /**
   * This method is made to run in the worker and will resolve as true when
   * the user is authenticated
   *
   * @returns {Promise.<true>} : if authenticated
   * @throws {Error}: TimeoutError from p-wait-for package if timeout expired
   */
  async waitForAuthenticated() {
    this.onlyIn(WORKER_TYPE, 'waitForAuthenticated')
    await waitFor(this.checkAuthenticated.bind(this), {
      interval: 1000,
      timeout: DEFAULT_LOGIN_TIMEOUT
    })
    return true
  }

  /**
   * Run a specified method in the worker webview
   *
   * @param {string} method : name of the method to run
   */
  async runInWorker(method, ...args) {
    this.onlyIn(PILOT_TYPE, 'runInWorker')
    if (!this.bridge) {
      throw new Error(
        'No bridge is defined, you should call ContentScript.init before using this method'
      )
    }
    return this.bridge.call('runInWorker', method, ...args)
  }

  /**
   * Wait for a method to resolve as true on worker
   *
   * @param {object} options        - options object
   * @param {string} options.method - name of the method to run
   * @param {number} [options.timeout] - number of miliseconds before the function sends a timeout error. Default Infinity
   * @param {Array} [options.args] - array of args to pass to the method
   * @returns {Promise<boolean>} - true
   * @throws {Error} - if timeout expired
   */
  async runInWorkerUntilTrue({ method, timeout = Infinity, args = [] }) {
    this.onlyIn(PILOT_TYPE, 'runInWorkerUntilTrue')
    log.debug('runInWorkerUntilTrue', method)
    let result = false
    const start = Date.now()
    const isTimeout = () => Date.now() - start >= timeout
    while (!result) {
      if (isTimeout()) {
        throw new Error('Timeout error')
      }
      log.debug('runInWorker call', method)
      result = await this.runInWorker(method, ...args)
      log.debug('runInWorker result', result)
    }
    return result
  }

  /**
   * Wait for a dom element to be present on the page, even if there are page redirects or page
   * reloads
   *
   * @param {string} selector - css selector we are waiting for
   */
  async waitForElementInWorker(selector) {
    this.onlyIn(PILOT_TYPE, 'waitForElementInWorker')
    await this.runInWorkerUntilTrue({
      method: 'waitForElementNoReload',
      args: [selector]
    })
  }

  /**
   * Wait for a dom element to be present on the page. This won't resolve if the page reloads
   *
   * @param {string} selector - css selector we are waiting for
   * @returns {Promise.<true>} - Returns true when ready
   */
  async waitForElementNoReload(selector) {
    this.onlyIn(WORKER_TYPE, 'waitForElementNoReload')
    log.debug('waitForElementNoReload', selector)
    await waitFor(() => Boolean(document.querySelector(selector)), {
      timeout: DEFAULT_WAIT_FOR_ELEMENT_TIMEOUT
    })
    return true
  }

  async click(selector) {
    this.onlyIn(WORKER_TYPE, 'click')
    const elem = document.querySelector(selector)
    if (!elem) {
      throw new Error(
        `click: No DOM element is matched with the ${selector} selector`
      )
    }
    elem.click()
  }

  async clickAndWait(elementToClick, elementToWait) {
    this.onlyIn(PILOT_TYPE, 'clickAndWait')
    log.debug('clicking ' + elementToClick)
    await this.runInWorker('click', elementToClick)
    log.debug('waiting for ' + elementToWait)
    await this.waitForElementInWorker(elementToWait)
    log.debug('done waiting ' + elementToWait)
  }

  async fillText(selector, text) {
    this.onlyIn(WORKER_TYPE, 'fillText')
    const elem = document.querySelector(selector)
    if (!elem) {
      throw new Error(
        `fillText: No DOM element is matched with the ${selector} selector`
      )
    }
    elem.focus()
    elem.value = text
    elem.dispatchEvent(new Event('input', { bubbles: true }))
    elem.dispatchEvent(new Event('change', { bubbles: true }))
  }

  /**
   * Download the file send by the launcher in the worker context
   *
   * @param {object} entry The entry to download with fileurl attribute
   */
  async downloadFileInWorker(entry) {
    this.onlyIn(WORKER_TYPE, 'downloadFileInWorker')
    this.log('info', 'downloading file in worker')
    if (entry.fileurl) {
      entry.blob = await ky.get(entry.fileurl, entry.requestOptions).blob()
      entry.dataUri = await blobToBase64(entry.blob)
    }
    return entry.dataUri
  }
  /**
   * Bridge to the saveFiles method from the launcher.
   * - it prefilters files according to the context comming from the launcher
   * - download files when not filtered out
   * - converts blob files to base64 uri to be serializable
   *
   * @param {Array} entries : list of file entries to save
   * @param {object} options : saveFiles options
   */
  async saveFiles(entries, options) {
    this.onlyIn(PILOT_TYPE, 'saveFiles')
    log.debug(entries, 'saveFiles input entries')
    const context = options.context
    log.debug(context, 'saveFiles input context')

    if (!this.bridge) {
      throw new Error(
        'No bridge is defined, you should call ContentScript.init before using this method'
      )
    }
    return await this.bridge.call('saveFiles', entries, options)
  }

  /**
   * Bridge to the saveBills method from the launcher.
   * - it first saves the files
   * - then saves bills linked to corresponding files
   *
   * @param {Array} entries : list of file entries to save
   * @param {object} options : saveFiles options
   */
  async saveBills(entries, options) {
    this.onlyIn(PILOT_TYPE, 'saveBills')
    const files = await this.saveFiles(entries, options)
    if (!this.bridge) {
      throw new Error(
        'No bridge is defined, you should call ContentScript.init before using this method'
      )
    }
    return await this.bridge.call('saveBills', files, options)
  }

  /**
   * Bridge to the getCredentials method from the launcher.
   */
  async getCredentials() {
    this.onlyIn(PILOT_TYPE, 'getCredentials')
    if (!this.bridge) {
      throw new Error(
        'No bridge is defined, you should call ContentScript.init before using this method'
      )
    }
    return await this.bridge.call('getCredentials')
  }

  /**
   * Bridge to the saveCredentials method from the launcher.
   *
   * @param {object} credentials : object with credentials specific to the current connector
   */
  async saveCredentials(credentials) {
    this.onlyIn(PILOT_TYPE, 'saveCredentials')
    if (!this.bridge) {
      throw new Error(
        'No bridge is defined, you should call ContentScript.init before using this method'
      )
    }
    return await this.bridge.call('saveCredentials', credentials)
  }

  /**
   * Bridge to the saveIdentity method from the launcher.
   *
   * @param {object} identity : io.cozy.contacts object
   */
  async saveIdentity(identity) {
    this.onlyIn(PILOT_TYPE, 'saveIdentity')
    if (!this.bridge) {
      throw new Error(
        'No bridge is defined, you should call ContentScript.init before using this method'
      )
    }
    return await this.bridge.call('saveIdentity', identity)
  }

  /**
   * Bridge to the getCookiesByDomain method from the RNlauncher.
   *
   * @param {string} domain : domain name
   */
  async getCookiesByDomain(domain) {
    if (!this.bridge) {
      throw new Error(
        'No bridge is defined, you should call ContentScript.init before using this method'
      )
    }
    return await this.bridge.call('getCookiesByDomain', domain)
  }

  /**
   * Bridge to the getCookieFromKeychainByName method from the RNlauncher.
   *
   * @param {string} cookieName : cookie name
   */
  async getCookieFromKeychainByName(cookieName) {
    if (!this.bridge) {
      throw new Error(
        'No bridge is defined, you should call ContentScript.init before using this method'
      )
    }
    return await this.bridge.call('getCookieFromKeychainByName', cookieName)
  }

  /**
   * Bridge to the saveCookieToKeychain method from the RNlauncher.
   *
   * @param {string} cookieValue : cookie value
   */
  async saveCookieToKeychain(cookieValue) {
    this.onlyIn(PILOT_TYPE, 'saveCookieToKeychain')
    if (!this.bridge) {
      throw new Error(
        'No bridge is defined, you should call ContentScript.init before using this method'
      )
    }
    return await this.bridge.call('saveCookieToKeychain', cookieValue)
  }

  async getCookieByDomainAndName(cookieDomain, cookieName) {
    this.onlyIn(WORKER_TYPE, 'getCookieByDomainAndName')
    if (!this.bridge) {
      throw new Error(
        'No bridge is defined, you should call ContentScript.init before using this method'
      )
    }
    const expectedCookie = await this.bridge.call(
      'getCookieByDomainAndName',
      cookieDomain,
      cookieName
    )
    return expectedCookie
  }

  /**
   * Send log message to the launcher
   *
   * @param {"debug"|"info"|"warn"|"error"} level : the log level
   * @param {string} message : the log message
   */
  log(level, message) {
    const allowedLevels = ['debug', 'info', 'warn', 'error']
    if (!message) {
      log.warn(
        `you are calling log without message, use log(level,message) instead`
      )
      return
    }
    if (!allowedLevels.includes(level)) {
      level = 'debug'
    }
    const now = new Date()
    this.bridge?.emit('log', {
      timestamp: now,
      level,
      msg: message
    })
  }

  /**
   * @typedef SetWorkerStateOptions
   * @property {string} [url]      : url displayed by the worker webview for the login
   * @property {boolean} [visible] : will the worker be visible or not
   */

  /**
   * This is a proxy to the "setWorkerState" command in the launcher
   *
   * @param {SetWorkerStateOptions} options : worker state options
   */
  async setWorkerState(options = {}) {
    this.onlyIn(PILOT_TYPE, 'setWorkerState')
    if (!this.bridge) {
      throw new Error(
        'No bridge is defined, you should call ContentScript.init before using this method'
      )
    }
    await this.bridge.call('setWorkerState', options)
  }

  /**
   * Set the current url of the worker
   *
   * @param {string} url : the url
   */
  async goto(url) {
    this.onlyIn(PILOT_TYPE, 'goto')
    await this.setWorkerState({ url })
  }

  /**
   * Make sur that the connector is authenticated to the website.
   * If not, show the login webview to the user to let her/him authenticated.
   * Resolve the promise when authenticated
   *
   * @throws LOGIN_FAILED
   * @returns {Promise.<boolean>} : true if the user is authenticated
   */
  async ensureAuthenticated() {
    return true
  }

  /**
   * Returns whatever unique information on the authenticated user which will be usefull
   * to identify fetched data : destination folder name, fetched data metadata
   *
   * @returns {Promise.<object>}  : user data object
   */
  async getUserDataFromWebsite() {}

  /**
   * In worker context, send the given data to the pilot to be stored in its own store
   *
   * @param {object} obj : any object with data to store
   */
  async sendToPilot(obj) {
    this.onlyIn(WORKER_TYPE, 'sendToPilot')
    if (!this.bridge) {
      throw new Error(
        'No bridge is defined, you should call ContentScript.init before using this method'
      )
    }
    return this.bridge.call('sendToPilot', obj)
  }

  /**
   * Store data sent from worker with sendToPilot method
   *
   * @param {object} obj : any object with data to store
   */
  async storeFromWorker(obj) {
    // @ts-ignore Aucune surcharge ne correspond à cet appel.
    Object.assign(this.store, obj)
  }

  onlyIn(csType, method) {
    if (this.contentScriptType !== csType) {
      throw new Error(`Use ${method} only from the ${csType}`)
    }
  }

  /**
   * Main function, fetches all connector data and save it to the cozy
   *
   * @param {object} options : options object
   * @param {object} options.context : all the data already fetched by the connector in a previous execution. Will be usefull to optimize
   * connector execution by not fetching data we already have.
   * @returns {Promise.<object>} : Connector execution result. TBD
   */
  // eslint-disable-next-line no-unused-vars
  async fetch(options) {}
}

function sendContentScriptReadyEvent() {
  // @ts-ignore La propriété 'ReactNativeWebView' n'existe pas sur le type 'Window & typeof globalThis'.
  if (window.ReactNativeWebView?.postMessage) {
    // @ts-ignore La propriété 'ReactNativeWebView' n'existe pas sur le type 'Window & typeof globalThis'.
    window.ReactNativeWebView?.postMessage(
      JSON.stringify({ message: 'NEW_WORKER_INITIALIZING' })
    )
  } else {
    log.error('No window.ReactNativeWebView.postMessage available')
  }
}
