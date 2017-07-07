const util = require('util')
util.inspect.defaultOptions.maxArrayLength = null
util.inspect.defaultOptions.colors = true

const env = process.env.NODE_ENV
const env2formats = {
  '': prodFormat,
  production: prodFormat,
  development: devFormat,
  standalone: devFormat
}
const format = env2formats[env]

if (!format) console.error('Error while loading the logger')

module.exports = function log (type, message, label) {
  console.log(format(type, message, label))
}

function prodFormat (type, message, label) {
  return JSON.stringify({ type, message, label })
}

function devFormat (type, message, label) {
  let formatmessage = message
  if (typeof formatmessage !== 'string') {
    formatmessage = util.inspect(formatmessage)
  }

  let formatlabel = ` : "${label}" `
  if (label === undefined) formatlabel = ``

  const type2color = {
    debug: 3, // yellow
    info: 4,  // blue
    error: 1, // red
    ok: 2     // green
  }

  let formattype = type
  if (type2color[type]) {
    formattype = `\u001b[3${type2color[type]}m${type}\u001b[0m`
  }
  return `${formattype}${formatlabel} : ${formatmessage}`
}
