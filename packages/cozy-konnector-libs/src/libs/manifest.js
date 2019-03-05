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

const manifest =
  typeof __WEBPACK_PROVIDED_MANIFEST__ !== 'undefined'
    ? __WEBPACK_PROVIDED_MANIFEST__
    : JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'manifest.konnector'))
      )

module.exports = manifest
