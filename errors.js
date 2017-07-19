'use strict'

const log = require('./logger')

const MSG = {
  TWOFACTOR: '2FA token requested'
}

function requireTwoFactor(extras = {}) {
  const extrasStr = Buffer(JSON.stringify(extras), 'binary').toString('base64')
  log('error', `${MSG.TWOFACTOR}||${extrasStr}`)
}

module.exports = {
  MSG: MSG,
  requireTwoFactor: requireTwoFactor
}
