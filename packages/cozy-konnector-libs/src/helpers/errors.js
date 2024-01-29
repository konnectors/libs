'use strict'

/**
 * The konnector could not login
 *
 * @type {string}
 */
const LOGIN_FAILED = 'LOGIN_FAILED'

/**
 * The folder specified as folder_to_save does not exist (checked by BaseKonnector)
 *
 * @type {string}
 */
const NOT_EXISTING_DIRECTORY = 'NOT_EXISTING_DIRECTORY'

/**
 * The vendor's website is down
 *
 * @type {string}
 */
const VENDOR_DOWN = 'VENDOR_DOWN'

/**
 * There was an unexpected error, please take a look at the logs to know what happened
 *
 * @type {string}
 */
const USER_ACTION_NEEDED = 'USER_ACTION_NEEDED'

/**
 * There was a problem while downloading a file
 *
 * @type {string}
 */
const FILE_DOWNLOAD_FAILED = 'FILE_DOWNLOAD_FAILED'

/**
 * There was a problem while saving a file
 *
 * @type {string}
 */
const SAVE_FILE_FAILED = 'SAVE_FILE_FAILED'

/**
 * Could not save a file to the cozy because of disk quota exceeded
 *
 * @type {string}
 */
const DISK_QUOTA_EXCEEDED = 'DISK_QUOTA_EXCEEDED'

/**
 * It seems that the website requires a second authentification factor that we don’t support yet.
 *
 * @type {string}
 */
const CHALLENGE_ASKED = 'CHALLENGE_ASKED'

/**
 * Temporarily blocked
 *
 * @type {string}
 */
const LOGIN_FAILED_TOO_MANY_ATTEMPTS = 'LOGIN_FAILED.TOO_MANY_ATTEMPTS'

/**
 * Access refresh required
 *
 * @type {string}
 */
const USER_ACTION_NEEDED_OAUTH_OUTDATED = 'USER_ACTION_NEEDED.OAUTH_OUTDATED'

/**
 * Unavailable account
 *
 * @type {string}
 */
const USER_ACTION_NEEDED_ACCOUNT_REMOVED = 'USER_ACTION_NEEDED.ACCOUNT_REMOVED'

/**
 * Unavailable account
 *
 * @type {string}
 */
const USER_ACTION_NEEDED_CHANGE_PASSWORD = 'USER_ACTION_NEEDED.CHANGE_PASSWORD'

/**
 * Password update required
 *
 * @type {string}
 */
const USER_ACTION_NEEDED_PERMISSIONS_CHANGED =
  'USER_ACTION_NEEDED.PERMISSIONS_CHANGED'

/**
 * The user needs to accept a CGU form before accessing the rest of the website
 *
 * @type {string}
 */
const USER_ACTION_NEEDED_CGU_FORM = 'USER_ACTION_NEEDED.CGU_FORM'

/**
 * solveCaptcha failed to solve the captcha
 *
 * @type {string}
 */
const CAPTCHA_RESOLUTION_FAILED = 'CAPTCHA_RESOLUTION_FAILED'

/**
 * Additionnal information is needed to check your login details
 *
 * @type {string}
 */
const LOGIN_FAILED_NEEDS_SECRET = 'LOGIN_FAILED.NEEDS_SECRET'

/**
 * remote website seems to be unavailable
 *
 * @type {string}
 */
const MAINTENANCE = 'MAINTENANCE'

/**
 * User needs to accept new terms
 *
 * @type {string}
 */
const TERMS_VERSION_MISMATCH = 'TERMS_VERSION_MISMATCH'

/**
 * unkown error
 *
 * @type {string}
 */
const UNKNOWN_ERROR = 'UNKNOWN_ERROR'

/**
 * The synchronization is complete but some elements may be missing
 *
 * @type {string}
 */
const UNKNOWN_ERROR_PARTIAL_SYNC = 'UNKNOWN_ERROR.PARTIAL_SYNC'

/**
 * Renewal of authentication required
 *
 * @type {string}
 */
const USER_ACTION_NEEDED_SCA_REQUIRED = 'USER_ACTION_NEEDED.SCA_REQUIRED'

/**
 * Authentication renewal required
 *
 * @type {string}
 */
const USER_ACTION_NEEDED_TWOFA_EXPIRED = 'USER_ACTION_NEEDED.TWOFA_EXPIRED'
/**
 * Authentication on vendor website required
 *
 * @type {string}
 */
const USER_ACTION_NEEDED_WEBAUTH_REQUIRED =
  'USER_ACTION_NEEDED.WEBAUTH_REQUIRED'
/**
 * Incorrect strong authentication code
 *
 * @type {string}
 */
const USER_ACTION_NEEDED_WRONG_TWOFA_CODE =
  'USER_ACTION_NEEDED.WRONG_TWOFA_CODE'
/**
 * Unavailable bank website
 *
 * @type {string}
 */
const VENDOR_DOWN_BANK_DOWN = 'VENDOR_DOWN.BANK_DOWN'
/**
 * Unavailable bank website
 *
 * @type {string}
 */
const VENDOR_DOWN_LINXO_DOWN = 'VENDOR_DOWN.LINXO_DOWN'

module.exports = {
  LOGIN_FAILED,
  LOGIN_FAILED_NEEDS_SECRET,
  LOGIN_FAILED_TOO_MANY_ATTEMPTS,
  NOT_EXISTING_DIRECTORY,
  FILE_DOWNLOAD_FAILED,
  SAVE_FILE_FAILED,
  DISK_QUOTA_EXCEEDED,
  CHALLENGE_ASKED,
  USER_ACTION_NEEDED,
  USER_ACTION_NEEDED_OAUTH_OUTDATED,
  USER_ACTION_NEEDED_ACCOUNT_REMOVED,
  USER_ACTION_NEEDED_CHANGE_PASSWORD,
  USER_ACTION_NEEDED_PERMISSIONS_CHANGED,
  USER_ACTION_NEEDED_CGU_FORM,
  USER_ACTION_NEEDED_SCA_REQUIRED,
  USER_ACTION_NEEDED_TWOFA_EXPIRED,
  USER_ACTION_NEEDED_WEBAUTH_REQUIRED,
  USER_ACTION_NEEDED_WRONG_TWOFA_CODE,
  CAPTCHA_RESOLUTION_FAILED,
  MAINTENANCE,
  TERMS_VERSION_MISMATCH,
  UNKNOWN_ERROR,
  UNKNOWN_ERROR_PARTIAL_SYNC,
  VENDOR_DOWN,
  VENDOR_DOWN_BANK_DOWN,
  VENDOR_DOWN_LINXO_DOWN
}
