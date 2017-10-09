const levels = {
  debug: 0,
  secret: 0,
  info: 10,
  warn: 20,
  error: 30,
  ok: 40
}

const filterLevel = function (level, type, message, label, namespace) {
  return levels[type] >= levels[level]
}

module.exports = {
  filterLevel
}
