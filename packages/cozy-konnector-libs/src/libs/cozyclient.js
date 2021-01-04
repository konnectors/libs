/**
 * [cozy-client-js](https://github.com/cozy/cozy-client-js) instance already
 * initialized and ready to use.
 *
 * @module cozyClient
 */

/* eslint no-console: off */

const { Client, MemoryStorage } = require('cozy-client-js')
const NewCozyClient = require('cozy-client').default
const globalFetch = require('node-fetch').default
global.fetch = globalFetch
global.Headers = globalFetch.Headers
// fixes an import problem of isomorphic fetch in cozy-client and cozy-client-js
const manifest = require('./manifest')

const getCozyClient = function(environment = 'production') {
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

  const options = {
    cozyURL: newCozyClient.stackClient.uri
  }
  if (environment === 'development') {
    options.oauth = { storage: new MemoryStorage() }
  } else if (environment === 'production') {
    options.token = process.env.COZY_CREDENTIALS
  }
  const cozyClient = new Client(options)
  if (environment === 'development') {
    const credentials = JSON.parse(process.env.COZY_CREDENTIALS)
    credentials.token.toAuthHeader = function() {
      return 'Bearer ' + credentials.client.registrationAccessToken
    }
    cozyClient.saveCredentials(credentials.oauthOptions, credentials.token)
  }

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

module.exports = cozyClient
