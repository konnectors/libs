/* global __APP_VERSION__ */

const log = require('cozy-logger')
const Raven = require('raven')
const { getDomain, getInstance } = require('./cozy-domain')

let isRavenConfigured = false

const ENV_DEV = 'development'
const ENV_SELF = 'selfhost'
const ENV_PROD = 'production'

const domainToEnv = {
  'cozy.tools': ENV_DEV,
  'cozy.works': ENV_DEV,
  'cozy.rocks': ENV_PROD,
  'mycozy.cloud': ENV_PROD
}

const getEnvironmentFromDomain = domain => {
  return domainToEnv[domain] || ENV_SELF
}

// Available in Projet > Settings > Client Keys
// Example : https://5f94cb7772deadbeef123456:39e4e34fdeadbeef123456a9ae31caba74c@errors.cozycloud.cc/12
const SENTRY_DSN = process.env.SENTRY_DSN

const afterFatalError = function (_err, sendErr, eventId) {
  if (!sendErr) {
    log(
      'debug',
      'Successfully sent fatal error with eventId ' + eventId + ' to Sentry'
    )
  }
  process.exit(1)
}

const afterCaptureException = function (sendErr, eventId) {
  if (!sendErr) {
    log(
      'debug',
      'Successfully sent exception with eventId ' + eventId + ' to Sentry'
    )
  }
  process.exit(1)
}

const setupSentry = function () {
  try {
    log('debug', 'process.env.SENTRY_DSN found, setting up Raven')
    const release =
      typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'
    const domain = getDomain()
    const environment = getEnvironmentFromDomain(domain)
    const instance = getInstance()
    Raven.config(SENTRY_DSN, {
      release,
      environment,
      autoBreadcrumbs: {
        console: true
      }
    }).install(afterFatalError)
    Raven.mergeContext({ tags: { domain, instance } })
    isRavenConfigured = true
    log('debug', 'Raven configured !')
  } catch (e) {
    log('warn', 'Could not load Raven, errors will not be sent to Sentry')
    log('warn', e)
  }
}

module.exports.captureExceptionAndDie = function (err) {
  log('debug', 'Capture exception and die')
  if (!isRavenConfigured) {
    process.exit(1)
  } else {
    try {
      log('debug', 'Sending exception to Sentry')
      Raven.captureException(
        err,
        { fingerprint: [err.message || err] },
        afterCaptureException
      )
    } catch (e) {
      log('warn', 'Could not send error to Sentry, exiting...')
      log('warn', e)
      log('warn', err)
      process.exit(1)
    }
  }
}

module.exports.wrapIfSentrySetUp = function (obj, method) {
  if (SENTRY_DSN && SENTRY_DSN !== 'false') {
    obj[method] = Raven.wrap(obj[method])
  }
}

if (SENTRY_DSN && SENTRY_DSN !== 'false') {
  setupSentry()
}
