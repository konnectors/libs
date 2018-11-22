/* eslint no-console: off */

const program = require('commander')
const fs = require('fs')
const path = require('path')
require('./open-in-browser')

program
  .usage('[options] <file>')
  .option(
    '--record',
    'Record all the requests in the ./fixtures directory using the replay module'
  )
  .option('--replay', 'Replay all the recorded requests')
  .option('--persist', 'Do not empty ./data/importedData.json at each run')
  .parse(process.argv)

process.env.NODE_ENV = 'standalone'
if (!process.env.DEBUG) process.env.DEBUG = '*'

const rootPath = path.resolve('./data')
if (!fs.existsSync(rootPath)) fs.mkdirSync(rootPath)
process.env.COZY_FIELDS = JSON.stringify({
  folder_to_save: rootPath
})

const config = require('./init-konnector-config')()
process.env.COZY_URL = config.COZY_URL

const filename =
  program.args[0] || process.env.npm_package_main || './src/index.js'

initReplay()

// sentry is not needed in dev mode
process.env.SENTRY_DSN = 'false'

if (fs.existsSync(path.resolve(filename))) {
  require(require('path').resolve(filename))
} else {
  console.log(
    `ERROR: File ${path.resolve(
      filename
    )} does not exist. cozy-run-standalone cannot run it.`
  )
}

/**
 * Inits the replay module
 * It is possible to activate it with an REPLAY environment variable
 * or the "--replay" or "--record" options which take predecedence
 *
 * Exemples :
 *
 * REPLAY=record cozy-konnector-standalone
 *
 * or
 *
 * cozy-konnector-standalone --record
 */
function initReplay() {
  const replayOption = ['record', 'replay'].find(opt => program[opt] === true)
  if (replayOption) process.env.REPLAY = replayOption

  process.env.REPLAY =
    replayOption || (process.env.REPLAY ? process.env.REPLAY : 'bloody')

  if (process.env.REPLAY !== 'bloody') require('replay')
  require('replay')
}
