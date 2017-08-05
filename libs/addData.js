const bluebird = require('bluebird')
const cozy = require('./cozyclient')
const log = require('./logger').namespace('addData')

module.exports = (entries, doctype) => {
  return bluebird.mapSeries(entries, entry => {
    log('debug', entry, 'Adding this entry')
    return cozy.data.create(doctype, entry)
  })
}
