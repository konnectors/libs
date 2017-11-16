const repl = require('repl')
const util = require('util')
const cheerio = require('cheerio')

process.env.NODE_ENV = 'standalone'
if (!process.env.DEBUG) process.env.DEBUG = '*'

process.env.COZY_FIELDS = JSON.stringify({
  folder_to_save: '.'
})

const libs = require('../index')

const cozyRepl = repl.start({
  useColors: true,
  useGlobal: true,
  ignoreUndefined: true,
  writer
})

Object.assign(cozyRepl.context, libs)

function writer (output) {
  if (output && output.constructor && output.constructor.name === 'Request') {
    output.then(body => {
      global.response = output.response
      global.$ = cheerio.load(output.response.body)
    })
    return ''
  }

  if (((output._root && output.parseHTML) || (output.cheerio)) && typeof output.html === 'function') {
    // if cheerio instance, output its HTML because of memory leaks
    if (output.length > 1) return `Cheerio instance ${output.length} elements`
    else return `Cheerio instance ${output.length} elements\n` + output.html()
  }

  return util.inspect(output)
}

global.rq = libs.request({ debug: true })
