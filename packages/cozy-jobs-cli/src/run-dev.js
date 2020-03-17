#!/usr/bin/env node
/* eslint no-console: off */

process.env.NODE_ENV = 'development'

const program = require('commander')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')
const authenticate = require('./cozy-authenticate')

let file, manifest

const DEFAULT_MANIFEST_PATH = path.resolve('manifest.konnector')
const DEFAULT_TOKEN_PATH = path.resolve('.token.json')

program
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

// Check for a .konnector file next to the launched file
manifest = program.manifest
if (!manifest && file) {
  const possibleManifestFile = file.replace(/\.js$/, '.konnector')
  if (fs.existsSync(possibleManifestFile)) {
    manifest = possibleManifestFile
  }
}

manifest = manifest || DEFAULT_MANIFEST_PATH
const token = program.token || DEFAULT_TOKEN_PATH

process.env.COZY_URL = process.env.COZY_URL
  ? process.env.COZY_URL
  : 'http://cozy.tools:8080'

authenticate({ tokenPath: token, manifestPath: manifest })
  .then(client => {
    process.env.COZY_CREDENTIALS = JSON.stringify({
      oauthOptions: client.stackClient.oauthOptions,
      token: client.stackClient.token
    })
  })
  .then(() => {
    const spawned = spawn(program.args[0], program.args.slice(1), {
      stdio: 'pipe'
    })
    spawned.stdout.on('data', data => {
      console.log(`${data}`)
    })
    spawned.stderr.on('data', data => {
      console.error(`${data}`)
    })
  })
  .catch(err => {
    console.log(err, 'unexpected error')
    setImmediate(() => process.exit(1))
  })

function abspath(p) {
  if (p) {
    return path.resolve(p)
  }
}
