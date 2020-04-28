'use strict'

const fs = require('fs')
const path = require('path')
const log = require('cozy-logger')
const stripJsonComments = require('strip-json-comments')

module.exports = getKonnectorConfig

const configPath = path.resolve('konnector-dev-config.json')

function getKonnectorConfig() {
  if (!fs.existsSync(configPath)) createKonnectorConfig()

  return JSON.parse(stripJsonComments(fs.readFileSync(configPath, 'utf8')))
}

const template = {
  COZY_URL: 'http://cozy.tools:8080', // this URL resolves to localhost, it works well when you have running local cozy-stack
  fields: {} // TODO read the fields in the manifest and add these fields in the template
}

function createKonnectorConfig() {
  fs.writeFileSync(configPath, JSON.stringify(template, null, '  '))
  log(
    'warn',
    `No ${configPath} file found, creating an empty one. To let you add fields for your connector.`
  )
  setImmediate(() => process.exit())
}
