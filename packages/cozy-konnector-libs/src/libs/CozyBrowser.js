/**
 * Get a javascript simulation of a real browser (jsdom)
 *
 * @module CozyBrowser
 */

const { CookieJar } = require('tough-cookie')
const log = require('cozy-logger').namespace('zombie')
const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:62.0) Gecko/20100101 Firefox/62.0'

let Browser
try {
  Browser = require('zombie')
} catch (err) {
  throw new Error(
    'zombie dependency is missing. Please add it in your package.json'
  )
}
const Fetch = require('zombie/lib/fetch')
const Path = require('path')
const _ = require('lodash')
const { isArray } = require('util')
const Bluebird = require('bluebird')
const assert = require('assert')
const URL = require('url')
const Request = require('request')

/**
 * Get a preconfigured jsdom browser simulator using the zombie npm package
 * See http://zombie.js.org/ for complete documentation
 * The connector has to import the zombie npm package itself.
 *
 * @param  {string} options.userAgent - The user agent string used by the browser
 * @returns {object} Zombie browser extended class
 * @example
 *
 * ```javascript
 * const Browser = require('cozy-konnector-libs/libs/CozyBrowser')
 * const browser = new Browser()
 * await browser.visit('http://quotes.toscrape.com/')
 * ```
 * @alias module:CozyBrowser
 */
const defaultOptions = {
  waitDuration: '20s',
  userAgent: DEFAULT_USER_AGENT
}

Browser.silent = true

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
      function (lastResponse, requestHandler) {
        return lastResponse || requestHandler(browser, request)
      },
      null
    ).then(function (response) {
      assert(
        response &&
          Object.prototype.hasOwnProperty.call(response, 'statusText'),
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
    return consumeBody.then(function (body) {
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

      return new Promise(function (resolve, reject) {
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
                headers: new Fetch.Headers(arrayOfHeaders)
              })
            )
          })
          .on('error', reject)
      })
    })
  }
}

Browser.Pipeline = CozyPipeline

Browser.extend(function (browser) {
  browser.pipeline = new Browser.Pipeline(browser)
  addListeners(browser)
  Object.assign(browser, defaultOptions)
  browser.getCookieJar = getCookieJar.bind(browser)
  browser.loadCookieJar = loadCookieJar.bind(browser)
})

/**
 * Add cozy-konnector-libs specific logs to browser events
 */
function addListeners(browser) {
  browser.on('error', error => {
    log('debug', `event error: ${error}`)
  })
  browser.on('loading', doc => {
    log('debug', `event loading: ${doc.location.href}`)
    return doc
  })
  browser.on('loaded', doc => {
    log('debug', `event loaded: ${doc.location}`)
    return doc
  })
  browser.on('setInterval', () => {
    log('debug', `event interval`)
  })
  browser.on('setTimeout', () => {
    log('debug', `event setTimeout`)
  })
  browser.on('idle', () => {
    log('debug', `event idle`)
  })
  browser.on('redirect', (request, response) => {
    log('debug', `redirect: ${request.url} -> ${response._url}`)
  })
  browser.on('request', request => {
    log('debug', `request: ${request.url}`)
  })
  browser.on('response', (request, response) => {
    log('debug', `response: ${response._url}`)
  })
}

function loadCookieJar(jar) {
  for (const cookie of jar.toJSON().cookies) {
    this.setCookie(
      {
        name: cookie.key,
        domain: cookie.domain,
        path: cookie.path,
        expires: cookie.expires,
        maxAge: cookie['max-age'],
        secure: cookie.secure,
        httpOnly: cookie.httpOnly
      },
      cookie.value
    )
  }
}

function getCookieJar() {
  return CookieJar.fromJSON(
    JSON.stringify({
      cookies: this.cookies.filter(c => c.toJSON).map(c => c.toJSON())
    })
  )
}

module.exports = Browser
