#!/usr/bin/env node
/* eslint no-console: off */

process.env.NODE_ENV = 'development'

const config = require('./init-konnector-config')()
const injectDevAccount = require('./inject-dev-account')

process.env.COZY_URL = config.COZY_URL
if (config.COZY_PARAMETERS) {
  process.env.COZY_PARAMETERS = JSON.stringify(config.COZY_PARAMETERS)
}
// sentry is not needed in dev mode
process.env.SENTRY_DSN = 'false'

const program = require('commander')
const path = require('path')
const fs = require('fs')
require('./open-in-browser')

const authenticate = require('./cozy-authenticate')

const DEFAULT_MANIFEST_PATH = path.resolve('manifest.konnector')
const DEFAULT_TOKEN_PATH = path.resolve('.token.json')

let file, manifest

program
  .usage('[options] <file>')
  .arguments('<file>')
  .action(_file => {
    file = _file
  })
  .option(
    '-t, --token [value]',
    'Token file location (will be created if does not exist)',
    abspath
  )
  .option(
    '-m, --manifest [value]',
    'Manifest file for permissions (manifest.webapp or manifest.konnector)',
    abspath
  )
  .parse(process.argv)

file = abspath(file || process.env.npm_package_main || './src/index.js')

// Check for a .konnector file next to the launched file
manifest = program.manifest
if (!manifest && file) {
  const possibleManifestFile = file.replace(/\.js$/, '.konnector')
  if (fs.existsSync(possibleManifestFile)) {
    manifest = possibleManifestFile
  }
}

file = abspath(file || process.env.npm_package_main || './src/index.js')
manifest = manifest || DEFAULT_MANIFEST_PATH
const token = program.token || DEFAULT_TOKEN_PATH

;(async () => {
  try {
    const { creds } = await authenticate({
      tokenPath: token,
      manifestPath: manifest
    })
    process.env.COZY_CREDENTIALS = JSON.stringify(creds)
    injectDevAccount(config)

    if (fs.existsSync(file)) {
      return require(file)
    } else {
      console.log(
        `ERROR: File ${file} does not exist. cozy-konnector-dev cannot run it.`
      )
    }
  } catch (err) {
    console.log(err, 'unexpected error')
    setImmediate(() => process.exit(1))
  }
})()

function abspath(p) {
  if (p) {
    return path.resolve(p)
  }
}
