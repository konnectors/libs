const log = require('cozy-logger').namespace('Error Interception')

// This will catch exception which would be uncaught by the connector script itself
process.on('uncaughtException', err => {
  console.error(err, 'uncaught exception')
  log('critical', err.message, 'uncaught exception')
  process.exit(1)
})
process.on('SIGTERM', () => {
  log('critical', 'The konnector got a SIGTERM')
  process.exit(128 + 15)
})
process.on('SIGINT', () => {
  log('critical', 'The konnector got a SIGINT')
  process.exit(128 + 2)
})
