'use strict'

const fs = require('fs')
const path = require('path')
const log = require('cozy-logger').namespace('init-dev-account')

const accountIdPath = path.resolve('.account')

module.exports = function () {
  return ensureAccount()
}

function ensureAccount () {
  const cozy = require('../libs/cozyclient')

  return getAccountId()
    .then(id => {
      log('debug', 'Found .account file')
      return cozy.data.find('io.cozy.accounts', id)
        .then(doc => doc._id)
    })
    .catch((err) => {
      log('warn', err.message, 'Error while getting the account')
      return createAccount()
    })
}

function getAccountId () {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(accountIdPath)) {
      resolve(fs.readFileSync(accountIdPath, 'utf-8').trim())
    } else reject(new Error(`No account file at ${accountIdPath}`))
  })
}

function createAccount () {
  const cozy = require('../libs/cozyclient')
  log('info', 'Creating a new dev account')
  return cozy.data.create('io.cozy.accounts', {
    name: 'dev_account',
    account_type: 'dev_account',
    status: 'PENDING',
    auth: require('./init-konnector-config')().fields
  })
  .then(doc => {
    fs.writeFileSync(accountIdPath, doc._id)
    return doc._id
  })
}
