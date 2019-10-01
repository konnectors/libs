/**
 * Get a javascript simulation of a real browser (jsdom)
 *
 * @module zombie
 */

const log = require('cozy-logger').namespace('zombie')
const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:62.0) Gecko/20100101 Firefox/62.0'

/**
 * Get a preconfigured jsdom browser simulator using the zombie npm package
 * See http://zombie.js.org/ for complete documentation
 * You have to import the zombie npm package yourself.
 *
 * @param  {string} options.userAgent - The user agent string used by the browser
 * @returns {Obect} Zombie browser instance
 *
 * @example
 *
 * ```javascript
 * const { zombie } = require('cozy-konnector-libs')
 * await zombie.visit('http://quotes.toscrape.com/')
 * ```
 *
 * @alias module:zombie
 */
function zombie(options) {
  const defaultOptions = {
    waitDuration: '20s',
    userAgent: DEFAULT_USER_AGENT
  }

  const finalOptions = { ...defaultOptions, options }
  const CozyBrowser = getCozyBrowser()
  const browser = new CozyBrowser(finalOptions)
  browser.pipeline = new CozyBrowser.Pipeline(browser)
  addListeners(browser)

  return browser
}

/**
 * Add cozy-konnector-libs specific logs to browser events
 */
function addListeners(browser) {
  browser.on('error', error => {
    log('info', `event error: ${error}`)
  })
  browser.on('loading', doc => {
    log('info', `event loading: ${doc.location.href}`)
    return doc
  })
  browser.on('loaded', doc => {
    log('info', `event loaded: ${doc.location}`)
    return doc
  })
  browser.on('setInterval', () => {
    log('info', `event interval`)
  })
  browser.on('setTimeout', () => {
    log('info', `event setTimeout`)
  })
  browser.on('idle', () => {
    log('info', `event idle`)
  })
  browser.on('redirect', (request, response) => {
    log('info', `redirect: ${request.url} -> ${response._url}`)
  })
  browser.on('request', request => {
    log('info', `request: ${request.url}`)
  })
  browser.on('response', (request, response) => {
    log('info', `response: ${response._url}`)
  })
}

/**
 * Create a Zombie class patched to not use bind rights which will allow it to work in our nsjail
 * environment
 */
function getCozyBrowser() {
  let Browser
  try {
    Browser = require('zombie')
  } catch (err) {
    throw new Error(
      'zombie dependency is missing. Please add it in your package.json'
    )
  }
  Browser.silent = true
  const Fetch = require('zombie/lib/fetch')
  const Path = require('path')
  const _ = require('lodash')
  const { isArray } = require('util')
  const Bluebird = require('bluebird')
  const assert = require('assert')
  const URL = require('url')
  const Request = require('request')
  class CozyPipeline extends Browser.Pipeline {
    constructor(browser) {
      super(browser)
      this.cozy = true
    }
    _getOriginalResponse(request) {
      const browser = this._browser
      const requestHandlers = this.getRequestHandlers().concat(
        CozyPipeline.makeHTTPRequest
      )

      return Bluebird.reduce(
        requestHandlers,
        function(lastResponse, requestHandler) {
          return lastResponse || requestHandler(browser, request)
        },
        null
      ).then(function(response) {
        assert(
          response && response.hasOwnProperty('statusText'),
          'Request handler must return a response'
        )
        return response
      })
    }
    static makeHTTPRequest(browser, request) {
      const { url } = request
      const { protocol, hostname, pathname } = URL.parse(url)

      if (protocol === 'file:') {
        // If the request is for a file:// descriptor, just open directly from the
        // file system rather than getting node's http (which handles file://
        // poorly) involved.
        if (request.method !== 'GET')
          return new Fetch.Response('', { url, status: 405 })

        const filename = Path.normalize(decodeURI(pathname))
        const exists = File.existsSync(filename)
        if (exists) {
          const stream = File.createReadStream(filename)
          return new Fetch.Response(stream, { url, status: 200 })
        } else return new Fetch.Response('', { url, status: 404 })
      }

      // We're going to use cookies later when receiving response.
      const { cookies } = browser
      const cookieHeader = cookies.serialize(hostname, pathname)
      if (cookieHeader) request.headers.append('Cookie', cookieHeader)

      const consumeBody =
        (/^POST|PUT/.test(request.method) && request._consume()) ||
        Promise.resolve(null)
      return consumeBody.then(function(body) {
        const httpRequest = new Request({
          method: request.method,
          uri: request.url,
          headers: request.headers.toObject(),
          // proxy:          browser.proxy,
          body,
          jar: false,
          followRedirect: false,
          strictSSL: browser.strictSSL
          // localAddress:   browser.localAddress || 0
        })

        return new Promise(function(resolve, reject) {
          httpRequest
            .on('response', response => {
              // Request returns an object where property name is header name,
              // property value is either header value, or an array if header sent
              // multiple times (e.g. `Set-Cookie`).
              const arrayOfHeaders = _.reduce(
                response.headers,
                (headers, value, name) => {
                  if (isArray(value))
                    for (let item of value) headers.push([name, item])
                  else headers.push([name, value])
                  return headers
                },
                []
              )

              resolve(
                new Fetch.Response(response, {
                  url: request.url,
                  status: response.statusCode,
                  headers: new Headers(arrayOfHeaders)
                })
              )
            })
            .on('error', reject)
        })
      })
    }
  }
  Browser.Pipeline = CozyPipeline
  return Browser
}

module.exports = zombie
