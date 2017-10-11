const util = require('util')
util.inspect.defaultOptions.maxArrayLength = null
util.inspect.defaultOptions.depth = null
util.inspect.defaultOptions.colors = true

const env = process.env.NODE_ENV || ''
const env2formats = {
  '': prodFormat,
  production: prodFormat,
  development: devFormat,
  standalone: devFormat,
  test: devFormat
}
const format = env2formats[env]

if (!format) console.error('Error while loading the logger')

function log (type, message, label, namespace) {
  if (type !== 'debug' || (process.env.DEBUG && process.env.DEBUG.length)) {
    console.log(format(type, message, label, namespace))
  }
}

module.exports = log

log.namespace = function (namespace) {
  return function (type, message, label, ns = namespace) {
    log(type, message, label, ns)
  }
}

function prodFormat (type, message, label, namespace) {
  // properly display error messages
  if (message.stack) message = message.stack
  if (message.toString) message = message.toString()

  return JSON.stringify({ time: new Date(), type, message, label, namespace })
}

function devFormat (type, message, label, namespace) {
  let formatmessage = message
  if (typeof formatmessage !== 'string') {
    formatmessage = util.inspect(formatmessage)
  }

  let formatlabel = ` : "${label}" `
  if (label === undefined) formatlabel = ``

  let formatnamespace = `\u001b[35m${namespace}: \u001b[0m`
  if (namespace === undefined) formatnamespace = ``

  const type2color = {
    debug: 6,   // cyan
    warning: 3, // yellow
    info: 4,    // blue
    error: 1,   // red
    ok: 2       // green
  }

  let formattype = type
  if (type2color[type]) {
    formattype = `\u001b[3${type2color[type]}m${type}\u001b[0m`
  }
  return `${formatnamespace}${formattype}${formatlabel} : ${formatmessage}`
}
