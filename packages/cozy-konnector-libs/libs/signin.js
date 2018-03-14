/**
 * The goal of this function is to provide an handy method to log the user in,
 * on html form pages. On success, it resolves a promise with a parsed body. On
 * failure, it throws a `LOGIN_FAILED` error.
 *
 * It does not submit values provided through `select` tags, except if populated
 * by user with `population`.
 * Limit between `baseUrl` and `page` is important. The form `action` will be
 * concatenated the same way `page` is, to constitute the submission url. For
 * now, a form with an absolute `action` is not comptabile with this function.
 *
 * - `baseUrl` is the root of the url
 *
 * - `page` is concatenate (adding a `/`) to `baseUrl` to access the html form
 *
 * - `formSelector` is used by cheerio to uniquely identify the form in which to
 *   log in
 *
 * - `population` is an object of { name: value, … }. It is used to populate the
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
 * - `opts` allows to pass eventual options to the `signin`'s `requestFactory`.
 *   It could be useful for pages using `latin1` `encoding` for instance.
 *
 * @module signin
 */
const errors = require('../helpers/errors')
const log = require('cozy-logger').namespace('cozy-konnector-libs')
const requestFactory = require('./request')

module.exports = function signin (
  baseUrl,
  page,
  formSelector,
  population,
  parseStrategy = 'cheerio',
  validate = defaultValidate,
  opts = {}) {

  const defaultOpts = { jar: true, cheerio: true, json: false }

  const rq = requestFactory({
    ...opts,
    ...defaultOpts
  })

  const parseBody = getStrategy(parseStrategy)

  return rq(`${baseUrl}/${page}`)
  .then($ => {
    const [action, inputs] = parseForm($, formSelector)
    for (let name in population) {
      inputs[name] = population[name]
    }

    return submitForm(rq, `${baseUrl}/${action}`, inputs, parseBody)
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
      const err = `signin: parsing strategy ${parseStrategy} unknown. `
      const hint = 'Use one of `raw`, `cheerio` or `json`'
      log('error', err + hint)
  }
}

function parseForm ($, formSelector) {
  const action = $(formSelector).attr('action')
  const inputs = {}
  const arr = $(formSelector).serializeArray()
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
}
