const { env2formats } = require('./log-formats')
const { filterLevel } = require('./log-filters')

const { DEBUG, NODE_ENV } = process.env
const env = (env2formats[NODE_ENV] && NODE_ENV) || 'production'
let level = DEBUG && DEBUG.length ? 'debug' : 'info'
const format = env2formats[env]
const filters = [filterLevel]

const filterOut = function (level, type, message, label, namespace) {
  for (const filter of filters) {
    if (filter.apply(null, arguments) === false) {
      return true
    }
  }
  return false
}

function log (type, message, label, namespace) {
  if (filterOut(level, type, message, label, namespace)) {
    return
  }
  console.log(format(type, message, label, namespace))
}

log.addFilter = function (filter) {
  return filters.push(filter)
}

log.setLevel = function (lvl) {
  level = lvl
}

// Short-hands
const methods = ['debug', 'info', 'warn', 'error', 'ok']
methods.forEach(level => {
  log[level] = function () {
    return log(level, message, label, namespace)
  }
})

module.exports = log

log.namespace = function (namespace) {
  return function (type, message, label, ns = namespace) {
    log(type, message, label, ns)
  }
}
