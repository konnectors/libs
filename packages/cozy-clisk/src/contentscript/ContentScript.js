// @ts-check
import Minilog from '@cozy/minilog'
import ky from 'ky/umd'
import pTimeout from 'p-timeout'
import waitFor, { TimeoutError } from 'p-wait-for'

import { blobToBase64, callStringFunction } from './utils'
import cliskPackageJson from '../../package.json'
import LauncherBridge from '../bridge/LauncherBridge'
import { calculateFileKey } from '../libs/utils'
import { wrapTimerFactory } from '../libs/wrapTimer'

const log = Minilog('ContentScript class')

const s = 1000
const m = 60 * s

const DEFAULT_LOGIN_TIMEOUT = 5 * m
const DEFAULT_WAIT_FOR_ELEMENT_TIMEOUT = 30 * s
const DEFAULT_WAIT_FOR_ELEMENT_ACCROSS_PAGES_TIMEOUT = 60 * s

export const PILOT_TYPE = 'pilot'
export const WORKER_TYPE = 'worker'

if (window?.addEventListener) {
  // allows cozy-clisk to be embedded in other envs (react-native, jest)
  window.addEventListener('load', () => {
    sendPageMessage('load')
  })
  window.addEventListener('DOMContentLoaded', () => {
    sendPageMessage('DOMContentLoaded')
  })
}

export default class ContentScript {
  constructor(options = {}) {
    sendPageMessage('NEW_WORKER_INITIALIZING')
    const logDebug = message => this.log('debug', message)
    const wrapTimerDebug = wrapTimerFactory({ logFn: logDebug })
    const logInfo = message => this.log('info', message)
    const wrapTimerInfo = wrapTimerFactory({ logFn: logInfo })
    this.ensureAuthenticated = wrapTimerInfo(this, 'ensureAuthenticated')
    this.ensureNotAuthenticated = wrapTimerInfo(this, 'ensureNotAuthenticated')
    this.getUserDataFromWebsite = wrapTimerInfo(this, 'getUserDataFromWebsite')
    this.fetch = wrapTimerInfo(this, 'fetch')
    this.waitForAuthenticated = wrapTimerDebug(this, 'waitForAuthenticated')
    this.waitForNotAuthenticated = wrapTimerDebug(
      this,
      'waitForNotAuthenticated'
    )
    this.runInWorker = wrapTimerDebug(this, 'runInWorker', {
      suffixFn: args => args?.[0]
    })
    this.runInWorkerUntilTrue = wrapTimerDebug(this, 'runInWorkerUntilTrue', {
      suffixFn: args => args[0]?.method
    })
    this.waitForElementInWorker = wrapTimerDebug(
      this,
      'waitForElementInWorker',
      {
        suffixFn: args => args?.[0]
      }
    )
    this.clickAndWait = wrapTimerDebug(this, 'clickAndWait', {
      suffixFn: args => `${args?.[0]} ${args?.[1]}`
    })
    this.saveFiles = wrapTimerDebug(this, 'saveFiles', {
      suffixFn: args => {
        return `${args?.[0].length} files`
      }
    })
    this.saveBills = wrapTimerDebug(this, 'saveBills')
    this.getCredentials = wrapTimerDebug(this, 'getCredentials')
    this.saveCredentials = wrapTimerDebug(this, 'saveCredentials')
    this.saveIdentity = wrapTimerDebug(this, 'saveIdentity')
    this.getCookiesByDomain = wrapTimerDebug(this, 'getCookiesByDomain', {
      suffixFn: args => args?.[0]
    })
    this.getCookieFromKeychainByName = wrapTimerDebug(
      this,
      'getCookieFromKeychainByName',
      { suffixFn: args => args?.[0] }
    )
    this.saveCookieToKeychain = wrapTimerDebug(this, 'saveCookieToKeychain', {
      suffixFn: args => args?.[0]
    })
    this.getCookieByDomainAndName = wrapTimerDebug(
      this,
      'getCookieByDomainAndName',
      { suffixFn: args => `${args?.[0]} ${args?.[1]}` }
    )
    this.goto = wrapTimerDebug(this, 'goto', { suffixFn: args => args?.[0] })
    this.downloadFileInWorker = wrapTimerDebug(this, 'downloadFileInWorker', {
      suffixFn: args => args?.[0]?.fileurl
    })
    this.waitForRequestInterception = wrapTimerDebug(
      this,
      'waitForRequestInterception',
      {
        suffixFn: args => args?.[0]
      }
    )
    if (options.requestInterceptor) {
      this.requestInterceptor = options.requestInterceptor
      this.requestInterceptor.setLogger(this.log.bind(this))
    }
  }
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
      'ensureNotAuthenticated',
      'checkAuthenticated',
      'waitForAuthenticated',
      'waitForNotAuthenticated',
      'waitForElementNoReload',
      'getUserDataFromWebsite',
      'fetch',
      'click',
      'fillText',
      'storeFromWorker',
      'clickAndWait',
      'getCookiesByDomain',
      'getCookieByDomainAndName',
      'downloadFileInWorker',
      'getDebugData',
      'getCliskVersion',
      'checkForElement',
      'evaluate'
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
  }

  /**
   * This method is called when the worker is ready on the current page. This is a good place to
   * subscribe to dom events for examples. These subscriptions will be replayed on each worker page
   * reload
   */
  onWorkerReady() {}

  /**
   * This method is called fon the pilot when the worker sends workerEvent events to the bridge
   */
  onWorkerEvent() {}

  /**
   * Set the ContentScript type. This is usefull to know which webview is the pilot or the worker
   *
   * @param {string} contentScriptType - ("pilot" | "worker")
   */
  async setContentScriptType(contentScriptType) {
    this.contentScriptType = contentScriptType
    log.info(`I am the ${contentScriptType}`)

    if (!this.bridge) {
      throw new Error(
        'No bridge is defined, you should call ContentScript.init before using this method'
      )
    }

    if (contentScriptType === WORKER_TYPE) {
      this.onWorkerReady()
      this.requestInterceptor?.on('response', response => {
        this.bridge?.emit('workerEvent', {
          event: 'requestResponse',
          payload: response
        })
      })
    } else if (contentScriptType === PILOT_TYPE) {
      this.bridge.addEventListener('workerEvent', this.onWorkerEvent.bind(this))
    }
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
   * @param {object} options        - options object
   * @param {number} [options.timeout] - number of miliseconds before the function sends a timeout error. Default 5m
   * @param {number} [options.interval] - interval in ms between checkAuthenticated calls. Default 1s
   * @returns {Promise.<true>} : if authenticated
   * @throws {TimeoutError}: TimeoutError from p-wait-for package if timeout expired
   */
  async waitForAuthenticated(options = {}) {
    this.onlyIn(WORKER_TYPE, 'waitForAuthenticated')
    const timeout = options.timeout || DEFAULT_LOGIN_TIMEOUT
    const interval = options.interval || 1000
    await waitFor(this.checkAuthenticated.bind(this), {
      interval,
      timeout: {
        milliseconds: timeout,
        message: new TimeoutError(
          `waitForAuthenticated timed out after ${timeout}ms`
        )
      }
    })
    return true
  }

  /**
   * Resolves when the dom is ready (DOMContentLoaded event)
   *
   * @returns {Promise<void>}
   */
  async waitForDomReady() {
    const self = this
    const domReadyPromise = new Promise(resolve => {
      // first check if the DOMContentLoad has already been called
      if (
        document?.readyState === 'complete' ||
        document?.readyState === 'loaded' ||
        document?.readyState === 'interactive'
      ) {
        resolve()
      } else {
        window.addEventListener('DOMContentLoaded', () => {
          resolve()
        })
      }
    })
    return pTimeout(domReadyPromise, {
      milliseconds: 10000,
      fallback: () =>
        self.log(
          'warn',
          'waitForDomReady timed out after 10s, we may have missed the DOMContentLoad event'
        )
    })
  }

  /**
   * This method is made to run in the worker and will resolve as true when
   * the user is not authenticated
   *
   * @param {object} options        - options object
   * @param {number} [options.timeout] - number of miliseconds before the function sends a timeout error. Default 30s
   * @param {number} [options.interval] - interval in ms between checkAuthenticated calls. Default 1s
   * @returns {Promise.<true>} : if not authenticated
   * @throws {TimeoutError}: TimeoutError from p-wait-for package if timeout expired
   */
  async waitForNotAuthenticated(options = {}) {
    this.onlyIn(WORKER_TYPE, 'waitForNotAuthenticated')
    const timeout = options.timeout || DEFAULT_WAIT_FOR_ELEMENT_TIMEOUT
    const interval = options.interval || 1000
    await waitFor(
      async () => {
        const authenticated = await this.checkAuthenticated.bind(this)()
        return !authenticated
      },
      {
        interval,
        timeout: {
          milliseconds: timeout,
          message: new TimeoutError(
            `waitForNotAuthenticated timed out after ${timeout}ms`
          )
        }
      }
    )
    return true
  }

  /**
   * Wait for the given identified request to be intercepted. The identified request must be defined and
   * sent to the ContentScript constructor
   *
   * @param {string} identifier - any identifier string defined in the RequestInterceptor
   * @param {object} [options] - options object
   * @param {number} [options.timeout] - number of miliseconds before the function sends a timeout error. Default 60000ms
   */
  waitForRequestInterception(identifier, options = {}) {
    this.onlyIn(PILOT_TYPE, 'waitForRequestInterception')
    const timeout = options?.timeout ?? 60000

    const interceptionPromise = new Promise(resolve => {
      const listener = ({ event, payload }) => {
        if (event === 'requestResponse' && payload.identifier === identifier) {
          if (!this.bridge) {
            throw new Error(
              'No bridge is defined, you should call ContentScript.init before using this method'
            )
          }
          this.bridge.removeEventListener('workerEvent', listener)
          resolve(payload)
        }
      }
      if (!this.bridge) {
        throw new Error(
          'No bridge is defined, you should call ContentScript.init before using this method'
        )
      }
      this.bridge.addEventListener('workerEvent', listener)
    })

    return pTimeout(interceptionPromise, {
      milliseconds: timeout,
      message: `Timed out after waiting ${timeout}ms for interception of ${identifier}`
    })
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
    return await this.bridge.call('runInWorker', method, ...args)
  }

  /**
   * Wait for a method to resolve as true on worker
   *
   * @param {object} options        - options object
   * @param {string} options.method - name of the method to run
   * @param {number} [options.timeout] - number of miliseconds before the function sends a timeout error. Default Infinity
   * @param {string} [options.suffix] - suffix used in timeout error message, to better identify error source
   * @param {Array} [options.args] - array of args to pass to the method
   * @returns {Promise<boolean>} - true
   * @throws {TimeoutError} - if timeout expired
   */
  async runInWorkerUntilTrue({
    method,
    timeout = Infinity,
    suffix = '',
    args = []
  }) {
    this.onlyIn(PILOT_TYPE, 'runInWorkerUntilTrue')
    log.debug('runInWorkerUntilTrue', method)
    let result = false
    const start = Date.now()
    const isTimeout = () => Date.now() - start >= timeout
    while (!result) {
      if (isTimeout()) {
        throw new TimeoutError(
          `runInWorkerUntilTrue ${method}${suffix} Timeout error after ${timeout}`
        )
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
   * @param {object} options - options object
   * @param {number} [options.timeout] - timeout in ms. Will default to 30s
   * @param {string} [options.includesText] - only select elements with the given text as innerText
   */
  async waitForElementInWorker(selector, options = {}) {
    this.onlyIn(PILOT_TYPE, 'waitForElementInWorker')
    await this.runInWorkerUntilTrue({
      method: 'waitForElementNoReload',
      suffix: selector,
      timeout:
        options?.timeout ?? DEFAULT_WAIT_FOR_ELEMENT_ACCROSS_PAGES_TIMEOUT,
      args: [selector, { includesText: options.includesText }]
    })
  }

  /**
   * Check if dom element is present on the page.
   *
   * @param {string} selector - css selector we are checking for
   * @returns {Promise<boolean>}  - Returns true or false
   */
  async isElementInWorker(selector, options = {}) {
    this.onlyIn(PILOT_TYPE, 'isElementInWorker')
    return await this.runInWorker('checkForElement', selector, options)
  }

  /**
   * Wait for a dom element to be present on the page. This won't resolve if the page reloads
   *
   * @param {string} selector - css selector we are waiting for
   * @param {object} [options] - options object
   * @param {string} [options.includesText] - only select elements wich include the given text as innerText
   * @returns {Promise.<true>} - Returns true when ready
   */
  async waitForElementNoReload(selector, options = {}) {
    this.onlyIn(WORKER_TYPE, 'waitForElementNoReload')
    log.debug('waitForElementNoReload', selector)
    await waitFor(() => this.checkForElement(selector, options), {
      timeout: {
        milliseconds: DEFAULT_WAIT_FOR_ELEMENT_TIMEOUT,
        message: new TimeoutError(
          `waitForElementNoReload ${selector}${
            options?.includesText ? ' "' + options.includesText + '"' : ''
          } timed out after ${DEFAULT_WAIT_FOR_ELEMENT_TIMEOUT}ms`
        )
      }
    })
    return true
  }

  /**
   * Check if a dom element is present on the page.
   *
   * @param {string} selector - css selector we are checking for
   * @param {object} [options] - options object
   * @param {string} [options.includesText] - only select elements with the given text as innerText
   * @returns {Promise<boolean>} - Returns true or false
   */
  async checkForElement(selector, options = {}) {
    this.onlyIn(WORKER_TYPE, 'checkForElement')

    return Boolean(this.selectElement(selector, options))
  }

  /**
   * Select a dom element with given selector and options
   *
   * @param {string} selector - css selector of the element
   * @param {object} [options] - options object
   * @param {string} [options.includesText] - only select element with the given text as innerText
   * @returns {object|null} - Returns the selected dom element or null
   */
  selectElement(selector, options = {}) {
    this.onlyIn(WORKER_TYPE, 'selectElement')

    if (
      options?.includesText &&
      typeof options.includesText === 'string' &&
      options.includesText !== undefined
    ) {
      return Array.from(document.querySelectorAll(selector)).find(element =>
        // @ts-ignore Argument of type 'string | undefined' is not assignable to parameter of type 'string'.  Type 'undefined' is not assignable to type 'string'.ts(2345)
        element.innerHTML?.includes(options.includesText)
      )
    } else {
      return document.querySelector(selector)
    }
  }

  /**
   * Click on a given element
   *
   * @param {string} selector - css selector of the element
   * @param {object} [options] - options object
   * @param {string} [options.includesText] - only select element with the given text as innerText
   * @returns {Promise<void>}
   */
  async click(selector, options = {}) {
    this.onlyIn(WORKER_TYPE, 'click')
    const elem = this.selectElement(selector, options)
    if (!elem) {
      throw new Error(
        `click: No DOM element is matched with the ${selector} selector`
      )
    }
    elem.click()
  }

  /**
   * Click on a given element and wait for another given element to be displayed on screen
   *
   * @param {string} elementToClick - css selector of the dom element to click in worker
   * @param {string} elementToWait - css selector of the dom element to wait in worker
   * @returns {Promise<void>}
   */
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
    const elem = this.selectElement(selector)
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
    this.log('debug', 'downloading file in worker')
    if (entry.fileurl) {
      try {
        entry.blob = await ky.get(entry.fileurl, entry.requestOptions).blob()
        entry.dataUri = await blobToBase64(entry.blob)
      } catch (error) {
        this.log('debug', `Full error : ${JSON.stringify(error)}`)
        const errorMessage = error.message
        let errorToLog = ''
        if (errorMessage.includes(/404|403|500|502|503/g)) {
          if (errorMessage.includes('404'))
            errorToLog = 'Website cannot find the wanted url'
          else if (errorMessage.includes('403'))
            errorToLog = 'User is not allowed to access the wanted URL'
          else errorToLog = 'Website server error accessing the wanted URL'
          this.log('error', errorToLog)
          throw new Error('VENDOR_DOWN')
        } else {
          throw new Error('UNKNOWN_ERROR')
        }
      }
    }
    return entry.dataUri
  }

  async getDebugData() {
    return {
      url: window.location.href,
      html: window.document.documentElement.outerHTML
    }
  }
  /**
   * Bridge to the saveFiles method from the launcher.
   * - it prefilters files according to the context comming from the launcher
   * - download files when not filtered out
   * - converts blob files to base64 uri to be serializable
   *
   * @param {Array<import('../launcher/saveFiles').saveFilesEntry & {shouldReplaceFile: Function}>} entries : list of file entries to save
   * @param {import('../launcher/saveFiles').saveFileOptions & {context: object, shouldReplaceFile: Function}} options : saveFiles options
   */
  async saveFiles(entries, options) {
    this.onlyIn(PILOT_TYPE, 'saveFiles')
    this.log('debug', `saveFiles ${entries.length} input entries`)
    const context = options.context
    log.debug(context, 'saveFiles input context')

    if (!this.bridge) {
      throw new Error(
        'No bridge is defined, you should call ContentScript.init before using this method'
      )
    }

    const updatedEntries = this.prepareSaveFileEntries(entries, options)

    return await this.bridge.call('saveFiles', updatedEntries, options)
  }

  /**
   * Prepare entries to be given to launcher saveFiles. Especially function attributes which will not be serialized to the launcher
   *
   * @param {Array<import('../launcher/saveFiles').saveFilesEntry & {shouldReplaceFile?: Function}>} entries
   * @param {import('../launcher/saveFiles').saveFileOptions & {context: object, shouldReplaceFile?: Function}} options
   */
  prepareSaveFileEntries(entries, options) {
    const existingFilesIndex = options?.context?.existingFilesIndex || {}

    const updatedEntries = [...entries]
    for (const entry of updatedEntries) {
      if (entry.forceReplaceFile === true || entry.forceReplaceFile === false) {
        // entry.forceReplaceFile has priority over shouldReplaceFile function
        continue
      }
      const shouldReplaceFileFn =
        entry.shouldReplaceFile || options.shouldReplaceFile
      if (shouldReplaceFileFn) {
        const existingFile =
          existingFilesIndex[calculateFileKey(entry, options.fileIdAttributes)]
        entry.forceReplaceFile = shouldReplaceFileFn(
          existingFile,
          entry,
          options
        )
        delete entry?.shouldReplaceFile
      }
    }
    delete options?.shouldReplaceFile
    return updatedEntries
  }

  /**
   * Query all the documents corresponding to the given query object. The client with permissions corresponding
   * to the current konnector manifest will be used.
   *
   * @param {import("cozy-client").QueryDefinition} queryDefinition - CozyClient query definition object
   * @param {import('cozy-client/types/types').QueryOptions} options - CozyClient query options
   * @returns {Promise<import('cozy-client/types/types').QueryResult>} Returns the list of documents
   */
  async queryAll(queryDefinition, options) {
    this.onlyIn(PILOT_TYPE, 'queryAll')
    if (!this.bridge) {
      throw new Error(
        'No bridge is defined, you should call ContentScript.init before using this method'
      )
    }

    return await this.bridge.call(
      'queryAll',
      queryDefinition.toDefinition(),
      options
    )
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
    if (!message) {
      log.warn(
        `you are calling log without message, use log(level,message) instead`
      )
      return
    }
    const now = new Date().toISOString()
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

  async blockWorkerInteractions() {
    this.onlyIn(PILOT_TYPE, 'blockWorkerInteractions')
    if (!this.bridge) {
      throw new Error(
        'No bridge is defined, you should call ContentScript.init before using this method'
      )
    }
    await this.bridge.call('blockWorkerInteractions')
  }

  async unblockWorkerInteractions() {
    this.onlyIn(PILOT_TYPE, 'unblockWorkerInteractions')
    if (!this.bridge) {
      throw new Error(
        'No bridge is defined, you should call ContentScript.init before using this method'
      )
    }
    await this.bridge.call('unblockWorkerInteractions')
  }

  /**
   * Evaluates a given function in worker context
   *
   * @param {Function} fn - the function to evaluate
   * @returns {Promise<any>} - function evaluation result
   */
  async evaluateInWorker(fn, ...args) {
    this.onlyIn(PILOT_TYPE, 'evaluateInWorker')
    return await this.runInWorker('evaluate', fn.toString(), ...args)
  }

  /**
   * Evaluates a given function string
   *
   * @param {string} fnString - the function string to evaluate
   * @returns {Promise<any>} - function evaluation result
   */
  async evaluate(fnString, ...args) {
    this.onlyIn(WORKER_TYPE, 'evaluate')
    return await callStringFunction(fnString, ...args)
  }

  /**
   * Make sure that the connector is authenticated to the website.
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
   * Make sure that the connector is not authenticated anymore to the website.
   *
   * @returns {Promise.<boolean>} : true if the user is not authenticated
   */
  async ensureNotAuthenticated() {
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
   * Determine if the konnector must fetch all or parts of the data.
   *
   * @param {object} options - All the data already fetched by the connector in a previous execution.
   *                                   Useful to optimize connector execution by not fetching data we already have.
   * @returns {Promise<object>} - Promise that resolves to an object with the following properties:
   * @property {boolean} shouldFullSync - Indicates if a full synchronization is needed.
   * @property {number|NaN} distanceInDays - The number of days since the last sync, or NaN if not applicable.
   */

  async shouldFullSync(options) {
    this.onlyIn(PILOT_TYPE, 'shouldFullSync')
    const { trigger, flags } = options
    let forceFullSync = false
    let flagFullSync = false
    if (flags['clisk.force-full-sync'] === true) {
      this.log('info', 'User forces full sync')
      flagFullSync = true
    }
    const isFirstJob =
      !trigger.current_state?.last_failure &&
      !trigger.current_state?.last_success
    const isLastJobError =
      !isFirstJob &&
      trigger.current_state?.last_failure > trigger.current_state?.last_success
    const hasLastExecution = Boolean(trigger.current_state?.last_execution)
    let distanceInDays = 0
    if (hasLastExecution) {
      distanceInDays = getDateDistanceInDays(
        trigger.current_state?.last_execution
      )
    }
    this.log('debug', `distanceInDays: ${distanceInDays}`)
    if (
      flagFullSync ||
      !hasLastExecution ||
      isLastJobError ||
      distanceInDays >= 30
    ) {
      this.log('info', '🐢️ Long execution')
      this.log(
        'debug',
        `isLastJobError: ${isLastJobError} | hasLastExecution: ${hasLastExecution}`
      )
      forceFullSync = true
    } else {
      this.log('info', '🐇️ Quick execution')
    }
    return { forceFullSync, distanceInDays }
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

  /**
   * Returns the current clisk version number in package.json file
   */
  async getCliskVersion() {
    return cliskPackageJson.version
  }
}

function sendPageMessage(message) {
  // @ts-ignore La propriété 'ReactNativeWebView' n'existe pas sur le type 'Window & typeof globalThis'.
  if (window.ReactNativeWebView?.postMessage) {
    // @ts-ignore La propriété 'ReactNativeWebView' n'existe pas sur le type 'Window & typeof globalThis'.
    window.ReactNativeWebView?.postMessage(JSON.stringify({ message }))
  } else {
    log.error('No window.ReactNativeWebView.postMessage available')
  }
}

function getDateDistanceInDays(dateString) {
  const distanceMs = Date.now() - new Date(dateString).getTime()
  const days = 1000 * 60 * 60 * 24

  return Math.floor(distanceMs / days)
}
