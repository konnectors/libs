const colors = require('colors')

const util = require('util')
util.inspect.defaultOptions.maxArrayLength = null
util.inspect.defaultOptions.colors = true

const env = process.env.NODE_ENV || ''
const env2formats = {
  '': prodFormat,
  production: prodFormat,
  development: devFormat,
  standalone: devFormat,
  test: devFormat
}

const type2color = {
  debug: 'cyan',
  warn: 'yellow',
  info: 'blue',
  error: 'red',
  ok: 'green'
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

  let formatlabel = label ? ` : "${label}" ` : ''
  let formatnamespace = namespace ? colors.purple(`${namespace}: `) : ''

  let color = type2color[type]
  let formattype = color ? colors[color](type) : type

  return `${formatnamespace}${formattype}${formatlabel} : ${formatmessage}`
}
