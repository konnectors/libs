let request = require('request-promise')
const requestdebug = require('request-debug')
const log = require('./logger')

let singleton = null

module.exports = function (options = {}) {
  if (singleton) return singleton

  const defaultOptions = {
    debug: false,
    json: true,
    cheerio: false,
    strictSSL: false,
    headers: {
      // a lot of web service do not want to be called by robots and then check the user agent to
      // be sure they are called by a browser. This user agent works most of the time.
      'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:36.0) ' +
                    'Gecko/20100101 Firefox/36.0'
    },
    followAllRedirects: true
  }

  options = Object.assign(defaultOptions, options)

  if (options.debug) requestdebug(request)

  const requestOptions = {}

  requestOptions.json = options.json
  requestOptions.jar = options.jar
  requestOptions.headers = options.headers
  requestOptions.followAllRedirects = options.followAllRedirects
  requestOptions.strictSSL = options.strictSSL

  if (options.cheerio) {
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

  request = request.defaults(requestOptions)

  log('debug', requestOptions, 'Getting a new request instance with the following options')

  return request
}
