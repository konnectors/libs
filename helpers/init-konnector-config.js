'use strict'

const fs = require('fs')
const path = require('path')
const debug = require('debug')('init-konnector-config')

module.exports = getKonnectorConfig

const configPath = path.resolve('konnector-dev-config.json')

function getKonnectorConfig () {
  if (!fs.existsSync(configPath)) createKonnectorConfig()
  return require(configPath)
}

const template = {
  COZY_URL: 'http://cozy.tools:8080', // this URL resolves to localhost, it works well when you have running local cozy-stack
  fields: {} // TODO read the fields in the manifest and add these fields in the template
}

function createKonnectorConfig () {
  debug(`No ${configPath} file found, creating an empty one. Don't you need to define some fields for your connector?`)
  fs.writeFileSync(configPath, JSON.stringify(template, null, '  '))
}
