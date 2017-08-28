const bluebird = require('bluebird')
const log = require('./logger').namespace('addData')

module.exports = (entries, doctype) => {
  const cozy = require('./cozyclient')
  return bluebird.mapSeries(entries, entry => {
    log('debug', entry, 'Adding this entry')
    return cozy.data.create(doctype, entry)
  })
}
