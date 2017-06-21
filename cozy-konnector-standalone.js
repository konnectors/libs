'use strict'

const log = require('./logger')

process.env.NODE_ENV = 'standalone'
if (!process.env.DEBUG) process.env.DEBUG = '*'
const debug = require('debug')('cozy-konnector-standalone')
const konnector = require(require('path').resolve('konnector.js'))

konnector.fetch({}, err => {
  log('debug', 'The konnector has been run')
  if (err) {
    log('error', err)
    debug(err)
    process.exit(1)
  }
})
