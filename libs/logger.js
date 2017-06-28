module.exports = function log (type, message) {
  console.log(JSON.stringify({ type, message }))
}
