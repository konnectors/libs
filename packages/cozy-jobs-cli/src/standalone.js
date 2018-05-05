const program = require('commander')

program
  .usage('[options] <file>')
  .option('--record', 'Record all the requests in the ./fixtures directory using the replay module')
  .option('--replay', 'Replay all the recorded requests')
  .parse(process.argv)


process.env.NODE_ENV = 'standalone'
if (!process.env.DEBUG) process.env.DEBUG = '*'

process.env.COZY_FIELDS = JSON.stringify({
  folder_to_save: '.'
})

const config = require('./init-konnector-config')()
process.env.COZY_URL = config.COZY_URL

const filename = program.args[0] || process.env.npm_package_main || './src/index.js'

initReplay()

// sentry is not needed in dev mode
process.env.SENTRY_DSN = 'false'
require(require('path').resolve(filename))

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

  process.env.REPLAY = replayOption || (process.env.REPLAY
        ? process.env.REPLAY
        : 'bloody')

  require('replay')
}
