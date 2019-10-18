/**
 * [cozy-client-js](https://github.com/cozy/cozy-client-js) instance already
 * initialized and ready to use.
 *
 * @module cozyClient
 */

/* eslint no-console: off */

const { Client, MemoryStorage } = require('cozy-client-js')
const NewCozyClient = require('cozy-client').default
const manifest = require('./manifest')

const getCredentials = function(environment) {
  try {
    if (environment === 'development') {
      const credentials = JSON.parse(process.env.COZY_CREDENTIALS)
      credentials.token.toAuthHeader = function() {
        return 'Bearer ' + credentials.client.registrationAccessToken
      }
      return credentials
    } else {
      return process.env.COZY_CREDENTIALS.trim()
    }
  } catch (err) {
    console.error(
      `Please provide proper COZY_CREDENTIALS environment variable. ${process.env.COZY_CREDENTIALS} is not OK`
    )
    throw err
  }
}

const getCozyUrl = function() {
  if (process.env.COZY_URL === undefined) {
    console.error(`Please provide COZY_URL environment variable.`)
    throw new Error('COZY_URL environment variable is absent/not valid')
  } else {
    return process.env.COZY_URL
  }
}

const getCozyClient = function(environment = 'production') {
  if (environment === 'standalone' || environment === 'test') {
    return require('../helpers/cozy-client-js-stub')
  }

  const credentials = getCredentials(environment)
  const cozyURL = getCozyUrl()

  const options = {
    cozyURL: cozyURL
  }

  if (environment === 'development') {
    options.oauth = { storage: new MemoryStorage() }
  } else if (environment === 'production') {
    options.token = credentials
  }

  const cozyClient = new Client(options)

  let token = credentials
  if (environment === 'development') {
    cozyClient.saveCredentials(credentials.client, credentials.token)
    token = credentials.token.accessToken
  }

  const cozyFields = JSON.parse(process.env.COZY_FIELDS || '{}')
  cozyClient.new = new NewCozyClient({
    uri: cozyURL,
    token,
    appMetadata: {
      slug: manifest.data.slug,
      sourceAccount: cozyFields.account,
      version: manifest.data.version
    }
  })

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
