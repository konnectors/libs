'use strict'

const log = require('../libs/logger')

const MSG = {
  TWOFACTOR: '2FA token requested'
}

function requireTwoFactor (extras = {}) {
  const extrasStr = Buffer(JSON.stringify(extras), 'binary').toString('base64')
  log('error', `${MSG.TWOFACTOR}||${extrasStr}`)
  return extrasStr
}

/**
 * The konnector could not login
 * @type {String}
 */
const LOGIN_FAILED = 'LOGIN_FAILED'

/**
 * The folder specified as folder_to_save does not exist (checked by BaseKonnector)
 * @type {String}
 */
const NOT_EXISTING_DIRECTORY = 'NOT_EXISTING_DIRECTORY'

/**
 * The vendor's website is down
 * @type {String}
 */
const VENDOR_DOWN = 'VENDOR_DOWN'

/**
 * There was an unexpected error, please take a look at the logs to know what happened
 * @type {String}
 */
const USER_ACTION_NEEDED = 'USER_ACTION_NEEDED'

module.exports = {
  MSG: MSG,
  LOGIN_FAILED,
  NOT_EXISTING_DIRECTORY,
  VENDOR_DOWN,
  USER_ACTION_NEEDED,
  requireTwoFactor: requireTwoFactor
}
