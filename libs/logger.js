
const { env2formats } = require('./log-formats')
const { filterLevel, filterSecrets } = require('./log-filters')

const { DEBUG, NODE_ENV, LOG_LEVEL } = process.env
const env = (env2formats[NODE_ENV] && NODE_ENV) || 'production'

let level = LOG_LEVEL || (DEBUG && DEBUG.length ? 'debug' : 'info')
const format = env2formats[env]
const filters = [filterLevel, filterSecrets]

const filterOut = function (level, type, message, label, namespace) {
  for (const filter of filters) {
    if (filter.apply(null, arguments) === false) {
      return true
    }
  }
  return false
}

/**
 * Use it to log messages in your konnector. Typical types are
 *
 * - `debug`
 * - `warning`
 * - `info`
 * - `error`
 * - `ok`
 *
 *
 * @example
 *
 * They will be colored in development mode. In production mode, those logs are formatted in JSON to be interpreted by the stack and possibly sent to the client. `error` will stop the konnector.
 *
 * ```js
 * logger = log('my-namespace')
 * logger('debug', '365 bills')
 * // my-namespace : debug : 365 bills
 * logger('info', 'Page fetched')
 * // my-namespace : info : Page fetched
 * ```
 * @param  {string} type
 * @param  {string} message
 * @param  {string} label
 * @param  {string} namespace
 */
function log (type, message, label, namespace) {
  if (filterOut(level, type, message, label, namespace)) {
    return
  }
  console.log(format(type, message, label, namespace))

  // Try to stop the connector after current running io before the stack
  if (type === 'critical') setImmediate(() => process.exit(1))
}

log.addFilter = function (filter) {
  return filters.push(filter)
}

log.setLevel = function (lvl) {
  level = lvl
}

// Short-hands
const methods = ['debug', 'info', 'warn', 'error', 'ok', 'critical']
methods.forEach(level => {
  log[level] = function (message, label, namespace) {
    return log(level, message, label, namespace)
  }
})

module.exports = log

log.namespace = function (namespace) {
  return function (type, message, label, ns = namespace) {
    log(type, message, label, ns)
  }
}
