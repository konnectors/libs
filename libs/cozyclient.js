const {Client, MemoryStorage} = require('cozy-client-js')
const log = require('debug')('cozyclient')

let cozy = null
if (process.env.NODE_ENV === 'standalone') {
  log('standalone mode')
  cozy = require('../helpers/cozy-client-js-stub')
} else if (process.env.NODE_ENV === 'development') {
  log('development mode')
  // COZY_CREDENTIALS
  let credentials = null
  try {
    credentials = JSON.parse(process.env.COZY_CREDENTIALS)
    log(credentials, 'COZY_CREDENTIALS')
  } catch (err) {
    log(err)
    console.log(`Please provide proper COZY_CREDENTIALS environment variable. ${process.env.COZY_CREDENTIALS} is not OK`)
    process.exit(1)
  }

  // COZY_URL
  if (process.env.COZY_URL === undefined) {
    console.log(`Please provide COZY_URL environment variable.`)
    process.exit(1)
  } else {
    log(process.env.COZY_URL, 'COZY_URL')
  }

  credentials.token.toAuthHeader = function () {
    return 'Bearer ' + credentials.client.registrationAccessToken
  }

  cozy = new Client({
    cozyURL: process.env.COZY_URL,
    oauth: {storage: new MemoryStorage()}
  })

  cozy.saveCredentials(credentials.client, credentials.token)
} else { // production mode
  log('production mode')
  // COZY_CREDENTIALS
  let credentials = null
  try {
    credentials = process.env.COZY_CREDENTIALS.trim()
    // log(credentials, 'COZY_CREDENTIALS')
  } catch (err) {
    log(err)
    console.log(`Please provide proper COZY_CREDENTIALS environment variable.`)
    process.exit(1)
  }

  // COZY_URL
  if (process.env.COZY_URL === undefined) {
    console.log(`Please provide COZY_URL environment variable.`)
    process.exit(1)
  } else {
    log(process.env.COZY_URL, 'COZY_URL')
  }

  cozy = new Client({
    token: credentials,
    cozyURL: process.env.COZY_URL
  })
}

module.exports = cozy
