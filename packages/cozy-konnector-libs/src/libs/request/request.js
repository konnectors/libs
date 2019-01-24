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
 * - `debug`: will display request and responses details in error output. Possible values :
 *   * true : display request and response in full json format
 *   * 'simple' : display main information about each request and response
 *   ```
 *   GET -> http://books.toscrape.com/media/cache/26/0c/260c6ae16bce31c8f8c95daddd9f4a1c.jpg
 *   <- 200  Content-Length: 7095
 *   ```
 *   * 'full' : display comple information about each request and response
 *   ```
 *   GET -> http://quotes.toscrape.com/login
 *
 *   BEGIN HEADERS
 *   host: quotes.toscrape.com
 *   END HEADERS
 *
 *   <- 200  Content-Length: 1869
 *
 *   BEGIN HEADERS
 *   server: nginx/1.12.1
 *   ...
 *   END HEADERS
 *
 *   BEGIN BODY
 *   <html>....
 *   END BODY
 *   ```
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

function requestFactory({ debug, ...options } = { debug: false }) {
  const logFn = setDebugFunction(debug)
  debug && requestdebug(request, logFn)
  return request.defaults(getRequestOptions(mergeDefaultOptions(options)))
}

function setDebugFunction(debug) {
  if (debug === 'simple') {
    return (type, data) => console.error(requestToStrings(type, data).oneline)
  } else if (debug === 'full') {
    return (type, data) => {
      const { oneline, headers, body } = requestToStrings(type, data)
      console.error(
        `${oneline}

BEGIN HEADERS
${headers}
END HEADERS

` +
          (body
            ? `BEGIN BODY
${body}
END BODY

`
            : '')
      )
    }
  } else if (typeof debug === 'function') {
    return (type, data, resp) =>
      debug({
        strings: requestToStrings(type, data),
        type,
        data,
        resp
      })
  }
}

function requestToStrings(type, data) {
  const result = {}
  if (type === 'request') {
    result.oneline = `${data.method} -> ${data.uri} ${
      data.headers['content-length']
        ? 'Content-Length: ' + data.headers['content-length']
        : ''
    }`
  } else if (type === 'response') {
    result.oneline = `<- ${data.statusCode}  ${
      data.headers['content-length']
        ? 'Content-Length: ' + data.headers['content-length']
        : ''
    }`
  } else {
    result.oneline = `<- ${data.statusCode} ${data.uri}`
  }

  result.headers = Object.keys(data.headers)
    .map(key => `${key}: ${data.headers[key]}`)
    .join('\n')

  result.body = data.body

  return result
}

function mergeDefaultOptions(options = {}) {
  const defaultOptions = {
    debug: false,
    json: true,
    cheerio: false,
    headers: {},
    followAllRedirects: true
  }
  if (options.cheerio === true) {
    options.json = false
  }

  return { ...defaultOptions, ...options }
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
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:62.0) Gecko/20100101 Firefox/62.0'
