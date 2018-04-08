process.env.NODE_ENV = 'development'

const config = require('./init-konnector-config')()

if (!process.env.DEBUG) process.env.DEBUG = '*'
process.env.COZY_URL = config.COZY_URL

const program = require('commander')
const path = require('path')
const fs = require('fs')

const authenticate = require('./cozy-authenticate')
const initDevAccount = require('./init-dev-account')

let useFolder = false
let file, manifest

program
  .usage('[options] <file>')
  .arguments('<file>')
  .action(_file => {
    file = _file
  })
  .option('-t, --token [value]', 'Token file location (will be created if does not exist)', abspath)
  .option('-m, --manifest [value]', 'Manifest file for permissions (manifest.webapp or manifest.konnector)', abspath)
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

authenticate({ tokenPath: program.token, manifestPath: manifest })
.then(result => {
  const credentials = result.creds
  const scopes = result.scopes
  if (scopes.includes('io.cozy.files')) useFolder = true

  // check if the token is valid
  process.env.COZY_CREDENTIALS = JSON.stringify(credentials)
})
.then(() => initDevAccount())
.then((accountId) => {
  process.env.COZY_FIELDS = JSON.stringify({
    account: accountId,
    folder_to_save: useFolder ? 'io.cozy.files.root-dir' : ''
  })
  return require(file)
})
.catch(err => {
  console.log(err, 'unexpected error')
  setImmediate(() => process.exit(1))
})

function abspath (p) {
  if (p) { return path.resolve(p) }
}
