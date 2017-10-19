const log = require('./logger').namespace('Error Interception')

// This will catch exception which would be uncaught by the connector script itself
process.on('uncaughtException', err => {
  console.error(err, 'uncaught exception')
  log('critical', err.message, 'uncaught exception')
})
process.on('SIGTERM', () => {
  log('critical', 'The konnector got a SIGTERM')
})
process.on('SIGINT', () => {
  log('critical', 'The konnector got a SIGINT')
})
