const _ = require('lodash')

const cozyClient = require('../cozyclient')

module.exports = {
  createNew (model) {
    return _.assignIn(model, {
      all (callback) {
        cozyClient.data.defineIndex(model.name, ['_id'])
        .then(index => cozyClient.data.query(index, {'selector': {_id: {'$gt': null}}}))
        .then(models => callback(null, models))
        .catch(err => callback(err))
      },

      create (entry, callback) {
        cozyClient.data.create(model.name, entry)
        .then(created => callback(null, created))
        .catch(err => callback(err))
      },
      updateAttributes (id, changes, callback) {
        cozyClient.data.updateAttributes(model.name, id, changes)
        .then(updated => callback(null, updated))
        .catch(err => callback(err))
      }
    })
  }
}
