module.exports = function log (type, message, label) {
  console.log(JSON.stringify({ type, message, label }, null, 2))
}
