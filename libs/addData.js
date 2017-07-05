const bluebird = require('bluebird')
const cozy = require('./cozyclient')
const log = require('./logger')

module.exports = (entries, doctype) => {
  return bluebird.mapSeries(entries, entry => {
    log('debug', entry, 'entry')
    return cozy.data.create(doctype, entry)
  })
}
