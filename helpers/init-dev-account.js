'use strict'

const cozy = require('../libs/cozyclient')
const fs = require('fs')
const path = require('path')
const debug = require('debug')('init-dev-account')

const accountIdPath = path.resolve('.account')

module.exports = function () {
  return ensureAccount()
}

function ensureAccount () {
  return getAccountId()
    .then(id => {
      debug('Found .account file')
      return cozy.data.find('io.cozy.accounts', id)
        .then(doc => doc._id)
    })
    .catch((err) => {
      debug(err.message)
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
  debug('creating a new account')
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
