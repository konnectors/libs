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

module.exports = {
  LOGIN_FAILED,
  NOT_EXISTING_DIRECTORY,
  VENDOR_DOWN,
  USER_ACTION_NEEDED,
  FILE_DOWNLOAD_FAILED,
  SAVE_FILE_FAILED,
  DISK_QUOTA_EXCEEDED
}
