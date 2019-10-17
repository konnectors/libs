#!/usr/bin/env node
/* eslint no-console: off */

process.env.NODE_ENV = 'development'

const config = require('./init-konnector-config')()
const injectDevAccount = require('./inject-dev-account')
const ArgumentParser = require('argparse').ArgumentParser

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

const parseArgs = () => {
  const parser = new ArgumentParser()
  parser.addArgument(['-t', '--token'], {
    type: abspath,
    defaultValue: DEFAULT_TOKEN_PATH,
    help: 'Token file location (will be created if does not exist)'
  })
  parser.addArgument(['-m', '--manifest'], {
    type: abspath,
    defaultValue: DEFAULT_MANIFEST_PATH,
    help:
      'Manifest file for permissions (manifest.webapp or manifest.konnector)'
  })
  parser.addArgument(['-a', '--create-account'], {
    action: 'storeTrue',
    dest: 'createAccount',
    help:
      'Indicates that the account should be created on the stack. By default, getAccount is mocked which breaks updateAccountAttributes and access to the konnector account'
  })
  parser.addArgument('file', {
    type: abspath,
    defaultValue: process.env.npm_package_main || './src/index.js',
    help: 'Konnector script'
  })
  const args = parser.parseArgs()

  let file = args.file
  let manifest = args.manifest

  // Check for a .konnector file next to the launched file
  if (!manifest && file) {
    const possibleManifestFile = file.replace(/\.js$/, '.konnector')
    if (fs.existsSync(possibleManifestFile)) {
      manifest = possibleManifestFile
    }
  }

  return args
}

const main = async () => {
  const args = parseArgs()
  await launchKonnector(args)
}

const launchKonnector = async ({ manifest, token, file }) => {
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
}

if (require.main === module) {
  main().catch(e => {
    console.error(e)
    process.exit(1)
  })
}

function abspath(p) {
  if (p) {
    return path.resolve(p)
  }
}
