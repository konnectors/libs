/**
 * The goal of this function is to provide an handy method to log the user in,
 * on html form pages. On success, it resolves a promise with a parsed body.
 *
 * Errors:
 *
 * - LOGIN_FAILED if the validate predicate is false
 * - INVALID_FORM if the element matched by `formSelector` is not a form or has
 *   no `action` attribute
 * - UNKNOWN_PARSING_STRATEGY if `parseStrategy` is not one of the accepted
 *   values : `raw`, `cheerio`, `json`.
 * - VENDOR_DOWN if a request throws a RequestError
 *
 * It does not submit values provided through `select` tags, except if populated
 * by user with `formData`.
 * Limit between `baseUrl` and `page` is important. The form `action` will be
 * concatenated the same way `page` is, to constitute the submission url. For
 * now, a form with an absolute `action` is not comptabile with this function.
 *
 * - `url` is the url to access the html form
 *
 * - `formSelector` is used by cheerio to uniquely identify the form in which to
 *   log in
 *
 * - `formData` is an object of { name: value, … }. It is used to populate the
 *   form, in the proper inputs with the same name as the properties of this
 *   object, before submitting it.
 *
 * - `parseStrategy` allow the user to resolve `signin` with a preparsed body.
 *   The choice of the strategy for the parsing is one of : `raw`, `json` or
 *   `cheerio`. `cheerio` being the default.
 *
 * - `validate` is a predicate takin two arguments `statusCode` and
 *   `parsedBody`. If it is false, `LOGIN_FAILED` is thrown, otherwise the
 *   konnector continues.
 *
 * - `requestOpts` allows to pass eventual options to the `signin`'s `requestFactory`.
 *   It could be useful for pages using `latin1` `encoding` for instance.
 *
 * @module signin
 */
const errors = require('../helpers/errors')
const rerrors = require('request-promise/errors')
const log = require('cozy-logger').namespace('cozy-konnector-libs')
const requestFactory = require('./request')

module.exports = function signin (
  {
    url,
    formSelector,
    formData = {},
    parse = 'cheerio',
    validate = defaultValidate,
    ...requestOpts
  } = {})
{
  // Check for mandatory arguments
  if (url === undefined) {
    throw 'signin: `url` must be defined'
  }
  if (formSelector === undefined) {
    throw 'signin: `formSelector` must be defined'
  }

  const rq = requestFactory({
    jar: true,
    ...requestOpts
  })

  const parseBody = getStrategy(parse)

  return rq({
    uri: url,
    cheerio: true
  }).catch(handleRequestErrors)
    .then($ => {
      const [action, inputs] = parseForm($, formSelector)
      for (let name in formData) {
        inputs[name] = formData[name]
      }

      return submitForm(rq, require('url').resolve(url, action), inputs, parseBody)
    })
    .then(([statusCode, parsedBody]) => {
      if (!validate(statusCode, parsedBody)) {
        throw new Error(errors.LOGIN_FAILED)
      } else {
        return Promise.resolve(parsedBody)
      }
    })
}

function defaultValidate (statusCode, body) {
  return statusCode === 200
}

function getStrategy (parseStrategy) {
  switch (parseStrategy) {
    case 'cheerio':
      return require('cheerio').load
    case 'json':
      return JSON.parse
    case 'raw':
      return (body) => body
    default:
      const err = `signin: parsing strategy \`${parseStrategy}\` unknown. `
      const hint = 'Use one of `raw`, `cheerio` or `json`'
      log('error', err + hint)
      throw new Error('UNKNOWN_PARSING_STRATEGY')
  }
}

function parseForm ($, formSelector) {
  const form = $(formSelector).first()
  const action = form.attr('action')

  if (!form.is('form')) {
    const err = 'element matching `' + formSelector + '` is not a `form`'
    log('error', err)
    throw new Error('INVALID_FORM')
  }
  if (action === undefined) {
    const err = 'form matching `' + formSelector + '` has no `action` attribute'
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

function submitForm (rq, uri, inputs, parseBody) {
  return rq({
    uri: uri,
    method: 'POST',
    form: {
      ...inputs
    },
    transform: (body, response) => [response.statusCode, parseBody(body)]
  })
    .catch(handleRequestErrors)
}

function handleRequestErrors (err) {
  if (err instanceof rerrors.RequestError || err instanceof rerrors.StatusCodeError) {
    log('error', err)
    throw errors.VENDOR_DOWN
  } else {
    return Promise.reject(err)
  }
}
