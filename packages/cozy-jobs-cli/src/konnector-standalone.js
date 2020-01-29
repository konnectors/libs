#!/usr/bin/env node
/* eslint no-console: off */

const program = require('commander')
const fs = require('fs')
const path = require('path')
const { Polly } = require('@pollyjs/core')
const nodeHttpAdapter = require('@pollyjs/adapter-node-http')
const fsPersister = require('@pollyjs/persister-fs')

require('./open-in-browser')

program
  .usage('[options] <file>')
  .option(
    '--record',
    'Record all the requests in the ./fixtures directory using the replay module'
  )
  .option('--replay', 'Replay all the recorded requests')
  .parse(process.argv)

process.env.NODE_ENV = 'standalone'

const rootPath = path.resolve('./data')
if (!fs.existsSync(rootPath)) fs.mkdirSync(rootPath)
process.env.COZY_FIELDS = JSON.stringify({
  folder_to_save: rootPath,
  account: 'default_account_id'
})

const config = require('./init-konnector-config')()
process.env.COZY_URL = config.COZY_URL
if (config.COZY_PARAMETERS) {
  process.env.COZY_PARAMETERS = JSON.stringify(config.COZY_PARAMETERS)
}

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
  if (replayOption) {
    Polly.register(nodeHttpAdapter)
    Polly.register(fsPersister)

    const polly = new Polly('standaloneRun', {
      adapters: ['node-http'],
      persister: ['fs'],
      logging: true,
      recordFailedRequests: true
    })

    if (program.record) {
      polly.record()
      process.on('beforeExit', async () => {
        await polly.stop()
      })
    }

    if (program.replay) {
      polly.replay()
    }
  }
}
