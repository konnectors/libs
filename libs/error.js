const log = require('./logger').namespace('Error Interception')

// This will catch exception which would be uncaught by the connector script itself
process.on('uncaughtException', err => {
  log('error', err.message, 'uncaught exception')
  exitAfterLogs()
})
process.on('uncaughtException', err => {
  log('error', err.message, 'uncaught exception')
  log('info', err, 'uncaught exception details')
  exitAfterLogs()
})
process.on('SIGTERM', () => {
  log('warning', 'The konnector got a SIGTERM')
  exitAfterLogs()
})
process.on('SIGINT', () => {
  log('warning', 'The konnector got a SIGINT')
  exitAfterLogs()
})

function exitAfterLogs () {
  setTimeout(() => process.exit(1), 500)
}
