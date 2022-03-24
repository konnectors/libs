/**
 * [cozy-client-js](https://github.com/cozy/cozy-client-js) instance already
 * initialized and ready to use.
 *
 * @module cozyClient
 */
/* eslint no-console: off */

const { Client, MemoryStorage } = require('cozy-client-js')
const NewCozyClient = require('cozy-client').default
const { models } = require('cozy-client')
const globalFetch = require('node-fetch').default
global.fetch = globalFetch
global.Headers = globalFetch.Headers
// fixes an import problem of isomorphic fetch in cozy-client and cozy-client-js
const manifest = require('./manifest')

const getCozyClient = function (environment = 'production') {
  if (environment === 'standalone' || environment === 'test') {
    return require('../helpers/cozy-client-js-stub')
  }

  const cozyFields = JSON.parse(process.env.COZY_FIELDS || '{}')
  const newCozyClient = NewCozyClient.fromEnv(process.env, {
    appMetadata: {
      slug: manifest.data.slug,
      sourceAccount: cozyFields.account,
      version: manifest.data.version
    }
  })
  newCozyClient.models = models

  const cozyClient = cozyClientJsFromEnv(newCozyClient.stackClient.uri)

  cozyClient.new = newCozyClient
  return cozyClient
}

/**
 * [cozy-client-js](https://github.com/cozy/cozy-client-js) instance already initialized and ready to use.
 *
 * If you want to access cozy-client-js directly, this method gives you directly an instance of it,
 * initialized according to `COZY_URL` and `COZY_CREDENTIALS` environment variable given by cozy-stack
 * You can refer to the [cozy-client-js documentation](https://github.com/cozy/cozy-client-js) for more information.
 *
 * Example :
 *
 * ```javascript
 * const {cozyClient} = require('cozy-konnector-libs')
 *
 * cozyClient.data.defineIndex('my.doctype', ['_id'])
 * ```
 *
 * @alias module:cozyClient
 */
const cozyClient = getCozyClient(
  // webpack 4 now changes the NODE_ENV environment variable when you change its 'mode' option
  // since we do not want to minimize the built file, we recognize the 'none' mode as production mode
  process.env.NODE_ENV === 'none' ? 'production' : process.env.NODE_ENV
)

function cozyClientJsFromEnv(cozyURL) {
  const options = { cozyURL }
  let jsonCredentials = null
  if (process.env.COZY_CREDENTIALS) {
    try {
      jsonCredentials = JSON.parse(process.env.COZY_CREDENTIALS)
    } catch (err) {
      options.token = process.env.COZY_CREDENTIALS
    }
  }

  if (jsonCredentials) {
    options.oauth = { storage: new MemoryStorage() }
  }

  const cozyClient = new Client(options)

  if (jsonCredentials) {
    jsonCredentials.token.toAuthHeader = function () {
      return 'Bearer ' + jsonCredentials.client.registrationAccessToken
    }
    cozyClient.saveCredentials(
      jsonCredentials.oauthOptions,
      jsonCredentials.token
    )
  }

  return cozyClient
}

module.exports = cozyClient
