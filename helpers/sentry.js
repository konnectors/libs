const log = require('../libs/logger')
const Raven = require('raven')

const SENTRY_DSN = process.env.SENTRY_DSN

const afterFatalError = function (err, sendErr, eventId) {
  if (!sendErr) {
    log('info', 'Successfully sent fatal error with eventId ' + eventId + ' to Sentry');
  }
  process.exit(1);
}

const afterCaptureException = function (sendErr, eventId) {
  if (!sendErr) {
    log('info', 'Successfully sent exception with eventId ' + eventId + ' to Sentry');
  }
  process.exit(1)
}

const setupSentry = function () {
  try {
    log('info', 'process.env.SENTRY_DSN found, setting up Raven')
    const release = typeof GIT_SHA !== 'undefined' ? GIT_SHA : 'dev'
    Raven.config(SENTRY_DSN, { release }).install(afterFatalError)
    log('info', 'Raven configured !')
  } catch (e) {
    log('warn', 'Could not load Raven, errors will not be sent to Sentry')
    log('warn', e)
  }
}

module.exports.captureExceptionAndDie = function (err) {
  log('info', 'Capture exception and die')
  if (!Raven) {
    process.exit(1)
  } else {
    try {
      log('info', 'Sending exception to Sentry')
      Raven.captureException(err, afterCaptureException)
    } catch (e) {
      log('warn', 'Could not send error to Sentry, exiting...')
      log('warn', e)
      process.exit(1)
    }
  }
}

module.exports.wrapIfSentrySetUp = function (obj, method) {
  if (SENTRY_DSN) {
    obj[method] = Raven.wrap(obj[method])
  }
}

if (SENTRY_DSN) {
  setupSentry()
}
