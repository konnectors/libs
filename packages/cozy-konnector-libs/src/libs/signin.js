/**
 * The goal of this function is to provide an handy method to log the user in,
 * on html form pages. On success, it resolves to a promise with a parsed body.
 *
 * Errors:
 *
 * - LOGIN_FAILED if the validate predicate is false
 * - INVALID_FORM if the element matched by `formSelector` is not a form or has
 *   no `action` attribute
 * - UNKNOWN_PARSING_STRATEGY if `parse` is not one of the accepted values:
 *   `raw`, `cheerio`, `json`.
 * - VENDOR_DOWN if a request throws a RequestError, or StatusCodeError
 *
 * It does not submit values provided through `select` tags, except if populated
 * by user with `formData`.
 *
 * - `url` is the url to access the html form
 *
 * - `formSelector` is used by cheerio to uniquely identify the form in which to
 *   log in
 *
 * - `formData` is an object `{ name: value, … }`. It is used to populate the
 *   form, in the proper inputs with the same name as the properties of this
 *   object, before submitting it. It can also be a function that returns this
 *   object. The page at `url` would be given as argument, right after having
 *   been parsed through `cheerio`.
 *
 * - `parse` allow the user to resolve `signin` with a preparsed body. The
 *   choice of the strategy for the parsing is one of : `raw`, `json` or
 *   `cheerio`. `cheerio` being the default.
 *
 * - `validate` is a predicate taking three arguments `statusCode`, `parsedBody` and `fullResponse`.
 *   If it is false, `LOGIN_FAILED` is thrown, otherwise the
 *   signin resolves with `parsedBody` value.
 *
 * - `requestOpts` allows to pass eventual options to the `signin`'s
 *   `requestFactory`. It could be useful for pages using `latin1` `encoding`
 *   for instance.
 *
 * @example
 * == basic example : ==
 * ```javascript
 * const $ = signin({
 *   url: `http://quotes.toscrape.com/login`,
 *   formSelector: 'form',
 *   formData: { username, password }
 * })
 * ```
 * If the behavior of the targeted website is not standard. You can pass a validate function which
 * will allow you to:
 *  - detect if the credentials work or not -> LOGIN_FAILED
 *  - detect if actions from the user are needed -> USER_ACTION_NEEDED
 *  - detect if the targeted website is out -> VENDOR_DOWN
 *
 * @example
 * ```javascript
 * const $ = signin({
 *   url: `http://quotes.toscrape.com/login`,
 *   formSelector: 'form',
 *   formData: { username, password },
 *   validate: (statusCode, $, fullResponse) {
 *    if (statusCode !== 200) return false // LOGIN_FAILED
 *    if ($('.cgu').length) throw new Error('USER_ACTION_NEEDED')
 *    if (fullResponse.request.uri.href.includes('error')) throw new Error('VENDOR_DOWN')
 *   }
 * })
 * ```
 *
 * Do not forget that the use of the signin function is not mandatory in a connector and won't work
 * if the signin page does not use html forms. Here, a simple POST request may be a lot more
 * simple.
 *
 * @module signin
 */
const errors = require('../helpers/errors')
const rerrors = require('request-promise/errors')
const log = require('cozy-logger').namespace('cozy-konnector-libs')
const requestFactory = require('./request')
const cheerio = require('cheerio')

module.exports = function signin({
  url,
  formSelector,
  formData = {},
  parse = 'cheerio',
  validate = defaultValidate,
  ...requestOpts
} = {}) {
  // Check for mandatory arguments
  if (url === undefined) {
    throw new Error('signin: `url` must be defined')
  }
  if (formSelector === undefined) {
    throw new Error('signin: `formSelector` must be defined')
  }

  const rq =
    requestOpts.requestInstance ||
    requestFactory({
      jar: true,
      json: false,
      ...requestOpts
    })

  const parseBody = getStrategy(parse)

  return rq({
    uri: url,
    transform: body => cheerio.load(body)
  })
    .catch(handleRequestErrors)
    .then($ => {
      const data = typeof formData === 'function' ? formData($) : formData
      const [action, inputs] = parseForm($, formSelector, url)
      for (let name in data) {
        inputs[name] = data[name]
      }

      return submitForm(
        rq,
        require('url').resolve(url, action),
        inputs,
        parseBody
      )
    })
    .then(([statusCode, parsedBody, fullResponse]) => {
      if (!validate(statusCode, parsedBody, fullResponse)) {
        throw new Error(errors.LOGIN_FAILED)
      } else {
        return Promise.resolve(parsedBody)
      }
    })
}

function defaultValidate(statusCode) {
  return statusCode === 200
}

function getStrategy(parseStrategy) {
  switch (parseStrategy) {
    case 'cheerio':
      return cheerio.load
    case 'json':
      return JSON.parse
    case 'raw':
      return body => body
    default: {
      const err = `signin: parsing strategy \`${parseStrategy}\` unknown. `
      const hint = 'Use one of `raw`, `cheerio` or `json`'
      log('error', err + hint)
      throw new Error('UNKNOWN_PARSING_STRATEGY')
    }
  }
}

function parseForm($, formSelector, currentUrl) {
  const form = $(formSelector).first()
  const action = form.attr('action') || currentUrl

  if (!form.is('form')) {
    const err = 'element matching `' + formSelector + '` is not a `form`'
    log('error', err)
    throw new Error('INVALID_FORM')
  }

  const inputs = {}
  const arr = form.serializeArray()
  for (let input of arr) {
    inputs[input.name] = input.value
  }
  return [action, inputs]
}

function submitForm(rq, uri, inputs, parseBody) {
  return rq({
    uri: uri,
    method: 'POST',
    form: {
      ...inputs
    },
    transform: (body, response) => [
      response.statusCode,
      parseBody(body),
      response
    ]
  }).catch(handleRequestErrors)
}

function handleRequestErrors(err) {
  if (
    err instanceof rerrors.RequestError ||
    err instanceof rerrors.StatusCodeError
  ) {
    log('error', err)
    throw new Error(errors.VENDOR_DOWN)
  } else {
    return Promise.reject(err)
  }
}
