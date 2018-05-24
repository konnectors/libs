process.env.NODE_ENV = 'development'

const config = require('./init-konnector-config')()

if (!process.env.DEBUG) process.env.DEBUG = '*'
process.env.COZY_URL = config.COZY_URL

const program = require('commander')
const path = require('path')
const fs = require('fs')

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

file = abspath(file || process.env.npm_package_main || './src/index.js')
manifest = manifest || DEFAULT_MANIFEST_PATH
const token = program.token || DEFAULT_TOKEN_PATH
authenticate({ tokenPath: token, manifestPath: manifest })
.then(result => {
  const credentials = result.creds

  // check if the token is valid
  process.env.COZY_CREDENTIALS = JSON.stringify(credentials)
})
.then(() => {
  const BaseKonnector = require('cozy-konnector-libs').BaseKonnector
  BaseKonnector.prototype.init = () => {
    return Promise.resolve({
      ...config.fields,
      folderPath: '/'
    })
  }

  // sentry is not needed in dev mode
  process.env.SENTRY_DSN = 'false'

  if (fs.existsSync(file)) {
    return require(file)
  } else {
    console.log(
      `ERROR: File ${file} does not exist. cozy-run-dev cannot run it.`
    )
  }
})
.catch(err => {
  console.log(err, 'unexpected error')
  setImmediate(() => process.exit(1))
})

function abspath (p) {
  if (p) { return path.resolve(p) }
}
