'use strict'

process.env.NODE_ENV = 'development'
process.env.DEBUG = '*'

const log = require('../lib/logger')
const debug = require('debug')('cozy-konnector-dev')

const config = require('./init-konnector-config')()
process.env.COZY_URL = config.COZY_URL

require('../lib/cozy-authenticate')()
.then(credentials => {
  // check if the token is valid
  process.env.COZY_CREDENTIALS = JSON.stringify(credentials)
})
.then(() => require('./init-dev-account')())
.then((accountId) => {
  const konnector = require(require('path').resolve('konnector.js'))

  konnector.fetch({account: accountId, folderPath: 'io.cozy.files.root-dir'}, err => {
    log('debug', 'The konnector has been run')
    if (err) {
      log('error', err)
      debug(err)
      process.exit(1)
    }
    process.exit(0)
  })
})
.catch(err => {
  // TODO do something clever with different error messages
  console.log(err, 'unexpected error')
  process.exit(1)
})
