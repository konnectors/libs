/**
 * This is a function which returns an instance of
 * [request-promise](https://www.npmjs.com/package/request-promise) initialized with
 * defaults often used in connector development.
 *
 * ```js
 * // Showing defaults
 * req = requestFactory({
 *   cheerio: false,
 *   jar: true,
 *   json: true
 * })
 * ```
 *
 * Options :
 *
 * - `cheerio`:  will parse automatically the `response.body` in a cheerio instance
 *
 * ```javascript
 * req = requestFactory({ cheerio: true })
 * req('http://github.com', $ => {
 *   const repos = $('#repo_listing .repo')
 * })
 * ```
 *
 * - `jar`: is passed to `request` options. Remembers cookies for future use.
 * - `json`: will parse the `response.body` as JSON
 * - `resolveWithFullResponse`: The full response will be return in the promise. It is compatible
 *   with cheerio and json options.
 *
 * ```javascript
 * req = requestFactory({
 *    resolveWithFullResponse: true,
 *    cheerio: true
 * })
 * req('http://github.com', response => {
 *   console.log(response.statusCode)
 *   const $ = response.body
 *   const repos = $('#repo_listing .repo')
 * })
 * ```
 *
 * You can find the full list of available options in [request-promise](https://github.com/request/request-promise) and [request](https://github.com/request/request) documentations.
 *
 * @module requestFactory
 */

let request = require('request-promise')
const requestdebug = require('request-debug')

exports = module.exports = {
  default: requestFactory,
  mergeDefaultOptions,
  transformWithCheerio,
  getRequestOptions
}

function requestFactory({ debug, ...options }) {
  debug && requestdebug(request)
  return request.defaults(getRequestOptions(mergeDefaultOptions(options)))
}

function mergeDefaultOptions(options = {}) {
  const defaultOptions = {
    debug: false,
    json: true,
    cheerio: false,
    strictSSL: false,
    headers: {},
    followAllRedirects: true
  }
  return { ...defaultOptions, ...options, json: !options.cheerio }
}

function transformWithCheerio(body, response, resolveWithFullResponse) {
  const result = require('cheerio').load(body)
  if (resolveWithFullResponse) {
    return {
      ...response,
      body: result
    }
  }
  return result
}

function getRequestOptions({ cheerio, userAgent, ...options }) {
  return cheerio
    ? {
        ...options,
        transform: transformWithCheerio,
        headers: {
          ...options.headers,
          'User-Agent':
            userAgent === undefined || userAgent
              ? DEFAULT_USER_AGENT
              : options.headers['User-Agent']
        }
      }
    : {
        ...options,
        headers: {
          ...options.headers,
          'User-Agent': userAgent
            ? DEFAULT_USER_AGENT
            : options.headers['User-Agent']
        }
      }
}

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:36.0) Gecko/20100101 Firefox/36.0'
