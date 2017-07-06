#!/usr/bin/env node

const http = require('http')
const path = require('path')
const fs = require('fs')
const log = require('../libs/logger')
const {Client, MemoryStorage} = require('cozy-client-js')
const manifest = require('./manifest')

const manifestPath = path.resolve('manifest.konnector')

const cozyURL = process.env.COZY_URL ? process.env.COZY_URL : 'http://cozy.tools:8080'
log('debug', cozyURL, 'COZY_URL')

const scopes = manifest.getScopes(manifestPath)

const tokenPath = path.resolve('.token.json')

// check if we have a token file
// if any return a promise with the credentials

function onRegistered (client, url) {
  let server
  return new Promise((resolve) => {
    server = http.createServer((request, response) => {
      if (request.url.indexOf('/do_access') === 0) {
        log('debug', request.url, 'url received')
        resolve(request.url)
        response.end('Authorization registered, you can close this page')
      }
    })
    server.listen(3333, () => {
      console.log('Please visit the following url to authorize the application: ', url)
    })
  })
  .then((url) => {
    server.close()
    return url
  }, (err) => {
    server.close()
    log('error', err, 'registration error')
    throw err
  })
}

function authenticate () {
  if (fs.existsSync(tokenPath)) {
    log('debug', 'token file already present')
    return Promise.resolve(JSON.parse(fs.readFileSync(tokenPath)))
  } else {
    const cozy = new Client({
      cozyURL,
      oauth: {
        storage: new MemoryStorage(),
        clientParams: {
          redirectURI: 'http://localhost:3333/do_access',
          softwareID: 'foobar',
          clientName: 'konnector', // should be the connector name (package.json's name ?)
          scopes: scopes
        },
        onRegistered
      }
    })

    return cozy.authorize()
      .then((creds) => {
        fs.writeFileSync(tokenPath, JSON.stringify(creds))
        return creds
      })
  }
}

module.exports = authenticate
