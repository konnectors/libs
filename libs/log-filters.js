const levels = {
  debug: 0,
  secret: 0,
  info: 10,
  warn: 20,
  error: 30,
  ok: 40,
  critical: 40
}

const Secret = require('./Secret')

const filterSecrets = function (level, type, message, label, namespace) {
  if (type !== 'secret' && message instanceof Secret) {
    const err = new Error()
    throw new Error('You should log a secret with log.secret')
  }
}

const filterLevel = function (level, type, message, label, namespace) {
  return levels[type] >= levels[level]
}

module.exports = {
  filterSecrets,
  filterLevel
}
