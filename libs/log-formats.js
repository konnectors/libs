const colors = require('colors')
const util = require('util')
util.inspect.defaultOptions.maxArrayLength = null
util.inspect.defaultOptions.colors = true

const type2color = {
  debug: 'cyan',
  warn: 'yellow',
  info: 'blue',
  error: 'red',
  ok: 'green',
  secret: 'red'
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
  let formatnamespace = namespace ? colors.magenta(`${namespace}: `) : ''

  let color = type2color[type]
  let formattype = color ? colors[color](type) : type

  return `${formatnamespace}${formattype}${formatlabel} : ${formatmessage}`
}

const env2formats = {
  production: prodFormat,
  development: devFormat,
  standalone: devFormat,
  test: devFormat
}

module.exports = { prodFormat, devFormat, env2formats }
