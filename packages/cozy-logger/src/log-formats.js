const chalk = require('chalk')
const util = require('util')
util.inspect.defaultOptions.maxArrayLength = null
util.inspect.defaultOptions.depth = null
util.inspect.defaultOptions.colors = true

const LOG_LENGTH_LIMIT = 64 * 1024 - 1

const type2color = {
  debug: 'cyan',
  warn: 'yellow',
  info: 'blue',
  error: 'red',
  ok: 'green',
  secret: 'red',
  critical: 'red'
}

function prodFormat (type, message, label, namespace) {
  const log = { time: new Date(), type, label, namespace }

  if (typeof message == 'object') {
    Object.assign(log, message)
  } else {
    log.message = message
  }

  // properly display error messages
  if (log.message.stack) {
    log.message = log.message.stack
  }

  // cut the string to avoid a fail in the stack
  return JSON.stringify(log).substr(0, LOG_LENGTH_LIMIT)
}

function devFormat (type, message, label, namespace) {
  let formatmessage = message

  if (typeof formatmessage !== 'string') {
    formatmessage = util.inspect(formatmessage)
  }

  let formatlabel = label ? ` : "${label}" ` : ''
  let formatnamespace = namespace ? chalk.magenta(`${namespace}: `) : ''

  let color = type2color[type]
  let formattype = color ? chalk[color](type) : type

  return `${formatnamespace}${formattype}${formatlabel} : ${formatmessage}`
}

const env2formats = {
  production: prodFormat,
  development: devFormat,
  standalone: devFormat,
  test: devFormat
}

module.exports = { prodFormat, devFormat, env2formats }
