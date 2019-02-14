'use strict'

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

/**
 * There was a problem while downloading a file
 * @type {String}
 */
const FILE_DOWNLOAD_FAILED = 'FILE_DOWNLOAD_FAILED'

/**
 * There was a problem while saving a file
 * @type {String}
 */
const SAVE_FILE_FAILED = 'SAVE_FILE_FAILED'

/**
 * Could not save a file to the cozy because of disk quota exceeded
 * @type {String}
 */
const DISK_QUOTA_EXCEEDED = 'DISK_QUOTA_EXCEEDED'

/**
 * It seems that the website requires a second authentification factor that we don’t support yet.
 * @type {String}
 */
const CHALLENGE_ASKED = 'CHALLENGE_ASKED'

/**
 * Temporarily blocked
 * @type {String}
 */
const LOGIN_FAILED_TOO_MANY_ATTEMPTS = 'LOGIN_FAILED.TOO_MANY_ATTEMPTS'

/**
 * Access refresh required
 * @type {String}
 */
const USER_ACTION_NEEDED_OAUTH_OUTDATED = 'USER_ACTION_NEEDED.OAUTH_OUTDATED'

/**
 * Unavailable account
 * @type {String}
 */
const USER_ACTION_NEEDED_ACCOUNT_REMOVED = 'USER_ACTION_NEEDED.ACCOUNT_REMOVED'

/**
 * Unavailable account
 * @type {String}
 */
const USER_ACTION_NEEDED_CHANGE_PASSWORD = 'USER_ACTION_NEEDED.CHANGE_PASSWORD'

/**
 * Password update required
 * @type {String}
 */
const USER_ACTION_NEEDED_PERMISSIONS_CHANGED =
  'USER_ACTION_NEEDED.PERMISSIONS_CHANGED'

/**
 * The user needs to accept a CGU form before accessing the rest of the website
 * @type {String}
 */
const USER_ACTION_NEEDED_CGU_FORM = 'USER_ACTION_NEEDED.CGU_FORM'

/**
 * solveCaptcha failed to solve the captcha
 * @type {String}
 */
const CAPTCHA_RESOLUTION_FAILED = 'CAPTCHA_RESOLUTION_FAILED'

module.exports = {
  LOGIN_FAILED,
  NOT_EXISTING_DIRECTORY,
  VENDOR_DOWN,
  USER_ACTION_NEEDED,
  FILE_DOWNLOAD_FAILED,
  SAVE_FILE_FAILED,
  DISK_QUOTA_EXCEEDED,
  CHALLENGE_ASKED,
  LOGIN_FAILED_TOO_MANY_ATTEMPTS,
  USER_ACTION_NEEDED_OAUTH_OUTDATED,
  USER_ACTION_NEEDED_ACCOUNT_REMOVED,
  USER_ACTION_NEEDED_CHANGE_PASSWORD,
  USER_ACTION_NEEDED_PERMISSIONS_CHANGED,
  USER_ACTION_NEEDED_CGU_FORM,
  CAPTCHA_RESOLUTION_FAILED
}
