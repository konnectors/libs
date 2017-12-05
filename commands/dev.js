process.env.NODE_ENV = 'development'
if (!process.env.DEBUG) process.env.DEBUG = '*'

const program = require('commander')
const authenticate = require('../helpers/cozy-authenticate')
const initDevAccount = require('../helpers/init-dev-account')
const config = require('../helpers/init-konnector-config')()
const path = require('path')

process.env.COZY_URL = config.COZY_URL

let useFolder = false

program
  .usage('[options] <file>')
  .option('-t, --token [value]', 'Token file location (will be created if does not exist)', abspath)
  .option('-m, --manifest [value]', 'Manifest file for permissions (manifest.webapp or manifest.konnector)', abspath)
  .parse(process.argv)

authenticate({ tokenPath: program.token, manifestPath: program.manifest })
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
  const filename = program.args[0] || 'index.js'
  const filepath = path.resolve(filename)
  return require(filepath)
})
.catch(err => {
  console.log(err, 'unexpected error')
  setImmediate(() => process.exit(1))
})

function abspath (p) {
  if (p) { return path.resolve(p) }
}
