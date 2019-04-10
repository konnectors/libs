/* global __WEBPACK_PROVIDED_MANIFEST__ */

/**
 * Manifest is provided differently in developement that in production.
 *
 * - In production, the manifest has been "merged" via Webpack via the
 *   DefinePlugin
 *
 * - In development/test, we simply read the manifest from the fs
 */

const fs = require('fs')
const path = require('path')

let manifest =
  typeof __WEBPACK_PROVIDED_MANIFEST__ !== 'undefined'
    ? __WEBPACK_PROVIDED_MANIFEST__
    : {}

if (process.env.NODE_ENV !== 'none' && process.env.NODE_ENV !== 'production') {
  try {
    manifest = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'manifest.konnector'))
    )
  } catch (err) {
    manifest = {}
  }
}

module.exports = manifest
