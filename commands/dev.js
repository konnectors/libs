'use strict'

process.env.NODE_ENV = 'development'
if (!process.env.DEBUG) process.env.DEBUG = '*'

const config = require('../helpers/init-konnector-config')()
process.env.COZY_URL = config.COZY_URL

let useFolder = false

require('../helpers/cozy-authenticate')()
.then(result => {
  const credentials = result.creds
  const scopes = result.scopes
  if (scopes.includes('io.cozy.files')) useFolder = true

  // check if the token is valid
  process.env.COZY_CREDENTIALS = JSON.stringify(credentials)
})
.then(() => require('../helpers/init-dev-account')())
.then((accountId) => {
  process.env.COZY_FIELDS = JSON.stringify({
    account: accountId,
    folder_to_save: useFolder ? 'io.cozy.files.root-dir' : ''
  })
  const filename = process.argv[2] || 'index.js'
  return require(require('path').resolve(filename))
})
.catch(err => {
  console.log(err, 'unexpected error')
  setImmediate(() => process.exit(1))
})
