/**
 * This is a function which returns an instance of
 * [request-promise](https://www.npmjs.com/package/request-promise) initialized with
 * defaults often used in connector development.
 *
 * ```js
 * // Showing defaults
 * req = request({
 *   cheerio: false,
 *   jar: true,
 *   json: true
 * })
 * ```
 *
 * - `cheerio`  will parse automatically the `response.body` in a cheerio instance
 *
 * ```js
 * req = request({ cheerio: true })
 * req('http://github.com', $ => {
 *   const repos = $('#repo_listing .repo')
 * })
 * ```
 *
 * - `jar` is passed to `request` options. Remembers cookies for future use.
 * - `json` will parse the `response.body` as JSON
 *
 * @module request
 */

let request = require('request-promise')
const requestdebug = require('request-debug')

let singleton = null
let requestClass = null

module.exports = function (options = {}) {
  if (singleton) return singleton

  if (request.Request) requestClass = request.Request

  const defaultOptions = {
    debug: false,
    json: true,
    cheerio: false,
    strictSSL: false,
    headers: {},
    followAllRedirects: true
  }

  options = Object.assign(defaultOptions, options)

  if (options.cheerio === true && !options.json) options.json = false

  if (options.debug) {
    // This avoids an error message comming from request-debug
    // see https://github.com/request/request-debug/blob/0.2.0/index.js#L15
    if (!request.Request) request.Request = requestClass
    requestdebug(request)
  }

  const requestOptions = {}

  requestOptions.json = options.json
  requestOptions.jar = options.jar
  requestOptions.headers = options.headers
  requestOptions.followAllRedirects = options.followAllRedirects
  requestOptions.strictSSL = options.strictSSL

  if (options.cheerio) {
    // a lot of web service do not want to be called by robots and then check the user agent to
    // be sure they are called by a browser. This user agent works most of the time.
    options.userAgent = true
    requestOptions.transform = function (body, response, resolveWithFullResponse) {
      let result = require('cheerio').load(body)

      if (resolveWithFullResponse === true) {
        response.body = result
        result = response
      }

      return result
    }
  } else {
    requestOptions.transform = function (body, response, resolveWithFullResponse) {
      let result = body
      if (resolveWithFullResponse === true) {
        result = response
      }
      return result
    }
  }

  if (options.userAgent === true) {
    requestOptions.headers['User-Agent'] = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:36.0) ' +
                                           'Gecko/20100101 Firefox/36.0'
  }

  request = request.defaults(requestOptions)

  return request
}
