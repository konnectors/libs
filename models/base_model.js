const _ = require('lodash')

const cozyClient = require('../cozyclient')

module.exports = {
  createNew (model) {
    return _.assignIn(model, {
      all (callback) {
        cozyClient.data.findAll(model.name)
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
