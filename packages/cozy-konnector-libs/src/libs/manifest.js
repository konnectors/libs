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
  typeof __WEBPACK_PROVIDED_MANIFEST__ === 'undefined'
    ? {}
    : __WEBPACK_PROVIDED_MANIFEST__

if (process.env.NODE_ENV !== undefined && process.env.NODE_ENV !== 'none' && process.env.NODE_ENV !== 'production') {
  try {
    manifest = getManifestFromFile()
  } catch (err) {
    manifest = {}
  }
}

function getManifestFromFile() {
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'manifest.konnector'))
  )
}

function setManifest(data) {
  manifest = data
}

function getCozyMetadata(data = {}) {
  const now = new Date(Date.now())
  const defaultData = {
    doctypeVersion: 1,
    metadataVersion: 1,
    createdAt: now,
    createdByApp: manifest.slug,
    createdByAppVersion: manifest.version,
    updatedAt: now,
    updatedByApps: [
      { slug: manifest.slug, date: now, version: manifest.version }
    ]
  }

  if (data.updatedByApps) {
    const index = data.updatedByApps.findIndex(
      app => app.slug === manifest.slug
    )
    if (index !== -1) {
      data.updatedByApps[index] = defaultData.updatedByApps.pop()
    }
  }

  return { ...defaultData, ...data }
}

module.exports = {
  data: manifest,
  getCozyMetadata,
  setManifest
}
