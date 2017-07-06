const util = require('util')
util.inspect.defaultOptions.maxArrayLength = null
util.inspect.defaultOptions.colors = true

const env = process.env.NODE_ENV
const formats = {
  '': prodFormat,
  production: prodFormat,
  development: devFormat,
  standalone: devFormat
}
const format = formats[env]

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
  return `${type}${formatlabel} : ${formatmessage}`
}
