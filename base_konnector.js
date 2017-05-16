'use strict'

const _ = require('lodash')
const slugify = require('cozy-slug')
const fetcher = require('./fetcher')
const cozy = require('./cozyclient')

module.exports = {

  /*
   * Add common features to given konnector:
   *
   * * build its slug.
   * * build description translation key based on slug.
   * * Change the array model to object (dirty hack to ensure backward
   *   compatibility).
   * * Add a default fetch function that runs operations set at konnector
   * level.
   */
  createNew: function (konnector) {
    var slug = slugify(konnector.slug || konnector.name)
    slug = slug.replace(/(-|\.)/g, '_')

    var modelsObj = {}
    konnector.models.forEach((model) => {
      modelsObj[model.displayName.toLowerCase()] = model
    })

    return _.assignIn(konnector, {
      slug: slug,
      description: `konnector description ${slug}`,
      models: modelsObj,

      fetch: function (cozyFields, callback) {
        var importer = fetcher.new()

        // First get the account related to the specified account id
        cozy.data.find('io.cozy.accounts', cozyFields.account)
        .catch(() => {
          console.error(`Account ${cozyFields.account} does not exist`)
          process.exit(0)
        })
        .then(account => {
          const requiredFields = Object.assign({
            folderPath: cozyFields.folderPath
          }, account.auth)

          konnector.fetchOperations.forEach(operation => {
            importer.use(operation)
          })
          importer.args(requiredFields, {}, {})
          importer.fetch((err, fields, entries) => {
            if (err) {
              callback(err)
            } else {
              callback(null, entries.notifContent)
            }
          })
        })
        .catch(err => {
          callback(err)
        })
      }

    })
  }
}
