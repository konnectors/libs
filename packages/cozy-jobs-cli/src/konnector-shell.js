#!/usr/bin/env node
/* eslint no-console: off */

const repl = require('repl')
const util = require('util')
const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')
const pretty = require('pretty')
const highlight = require('cli-highlight').highlight
require('./open-in-browser')

process.env.NODE_ENV = 'standalone'

const rootPath = path.resolve('./data')
if (!fs.existsSync(rootPath)) fs.mkdirSync(rootPath)
process.env.COZY_FIELDS = JSON.stringify({
  folder_to_save: rootPath
})

const libs = require('cozy-konnector-libs')

const cozyRepl = repl.start({
  useColors: true,
  useGlobal: true,
  ignoreUndefined: true,
  writer
})

Object.assign(cozyRepl.context, libs)

function writer(output) {
  if (output && output.constructor && output.constructor.name === 'Request') {
    output.then(() => {
      global.response = output.response
      global.$ = cheerio.load(output.response.body)
      // console.log(
      //   `[${global.response.statusCode}] ${global.response.statusMessage}`
      // )
    })
    return ''
  }

  if (
    ((output._root && output.parseHTML) || output.cheerio) &&
    typeof output.html === 'function'
  ) {
    // if cheerio instance, output its HTML because of memory leaks
    if (output.length > 1 && !output.root) {
      console.log(
        Array.from(output).map(elem => ({
          type: elem.name,
          html: pretty(global.$(elem).html()),
          text: global
            .$(elem)
            .text()
            .replace('\n', '')
            .trim()
        }))
      )
      return `Cheerio instance ${output.length} elements`
    } else {
      // return `Cheerio instance ${output.length} elements\n`
      return (
        `Cheerio instance ${output.length} elements\n` +
        highlight(pretty(output.html(), { ocd: true }))
      )
    }
  }

  return util.inspect(output)
}

// allows to directly load a HTML file in the shell
loadFile(process.argv[2])
function loadFile(filepath) {
  if (!fs.existsSync(filepath)) return

  const text = fs.readFileSync(filepath, 'utf-8')
  global.response = { body: text }
  global.$ = cheerio.load(text)
  console.log(`${filepath} loaded`)
}

global.request = libs.requestFactory({ jar: true })

global.debug = function(value = true) {
  global.request = libs.requestFactory({ debug: value })
}
