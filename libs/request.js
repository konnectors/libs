let request = require('request-promise')
const log = require('./logger')

let singleton = null

module.exports = function (options = {}) {
  if (singleton) return singleton

  const defaultOptions = {
    debug: false,
    json: true,
    cheerio: false,
    headers: {
      // a lot of web service do not want to be called by robots and then check the user agent to
      // be sure they are called by a browser. This user agent works most of the time.
      'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:36.0) ' +
                    'Gecko/20100101 Firefox/36.0'
    },
    followAllRedirects: true
  }

  options = Object.assign(defaultOptions, options)

  const requestOptions = {}
  if (options.debug) require('request-debug')(request)

  requestOptions.json = options.json
  requestOptions.jar = options.jar
  requestOptions.headers = options.headers
  requestOptions.followAllRedirects = options.followAllRedirects

  if (options.cheerio) requestOptions.transform = (body) => require('cheerio').load(body)

  request = request.defaults(requestOptions)

  log('debug', requestOptions, 'Getting a new request instance with the following options')

  return request
}
