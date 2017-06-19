'use strict'

const _ = require('lodash')
const slugify = require('cozy-slug')
const fetcher = require('./fetcher')
const cozy = require('./cozyclient')
const log = require('./logger')
const debug = require('debug')('base_konnector')

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
        // FIXME : this should be removed when stack offers a clean way to pass DEBUG='*' in debug mode
        process.env.DEBUG = process.env.DEBUG || '*'
        debug(cozyFields, 'cozyFields in fetch')
        var importer = fetcher.new()

        // First get the account related to the specified account id
        cozy.data.find('io.cozy.accounts', cozyFields.account)
        .catch(err => {
          console.error(`Account ${cozyFields.account} does not exist`)
          debug(err, 'error while fetching the account')
          process.exit(0)
        })
        .then(account => {
          // get the folder path from the folder id and put it in cozyFields.folderPath
          return new Promise((resolve, reject) => {
            cozy.files.statById(cozyFields.folderPath, false)
            .then(folder => {
              cozyFields.folderPath = folder.attributes.path
              debug(folder, 'folder details')
              resolve(account)
            })
            .catch(err => {
              debug(err, 'error while getting the folder path')
              log('error', err.message)
              reject(new Error('NOT_EXISTING_DIRECTORY'))
            })
          })
        })
        .then(account => {
          debug(account, 'account content')
          const requiredFields = Object.assign({
            folderPath: cozyFields.folderPath
          }, account.auth, account.oauth)

          konnector.fetchOperations.forEach(operation => {
            importer.use(operation)
          })
          importer.args(requiredFields, {}, {})
          importer.fetch((err, fields, entries) => {
            debug(entries, 'final entries')
            if (err) {
              debug(err, 'error during the fetch operations of the connector')
              callback(err)
            } else {
              callback(null, entries.notifContent)
            }
          })
        })
        .catch(err => {
          debug(err, 'unexpected error while running the connector')
          callback(err.message || err)
        })
      }
    })
  }
}
