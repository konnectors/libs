#!/usr/bin/env node

const http = require('http')
const path = require('path')
const fs = require('fs')
const log = require('cozy-logger').namespace('cozy-authenticate')
const {Client, MemoryStorage} = require('cozy-client-js')
const manifest = require('./manifest')

const DEFAULT_MANIFEST_PATH = path.resolve('manifest.konnector')
const DEFAULT_TOKEN_PATH = path.resolve('.token.json')

const cozyURL = process.env.COZY_URL ? process.env.COZY_URL : 'http://cozy.tools:8080'
log('debug', cozyURL, 'COZY_URL')

// check if we have a token file
// if any return a promise with the credentials

function onRegistered (client, url) {
  let server
  return new Promise((resolve) => {
    server = http.createServer((request, response) => {
      if (request.url.indexOf('/do_access') === 0) {
        log('debug', request.url, 'url received')
        resolve(request.url)
        response.end('Authorization registered, you can close this page and go back to the cli')
      }
    })
    server.listen(3333, () => {
      require('opn')(url, {wait: false})
      console.log('A new tab just opened in your browser to require the right authorizations for this connector in your cozy. Waiting for it...')
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

function authenticate ({ manifestPath = DEFAULT_MANIFEST_PATH, tokenPath = DEFAULT_TOKEN_PATH }) {
  const scopes = manifest.getScopes(manifestPath)
  if (!scopes.includes('io.cozy.accounts')) {
    scopes.push('io.cozy.accounts')
  }
  if (fs.existsSync(tokenPath)) {
    log('debug', 'token file already present')
    return Promise.resolve({creds: JSON.parse(fs.readFileSync(tokenPath)), scopes})
  } else {
    const cozy = new Client({
      cozyURL,
      oauth: {
        storage: new MemoryStorage(),
        clientParams: {
          redirectURI: 'http://localhost:3333/do_access',
          softwareID: 'foobar',
          clientName: 'konnector', // should be the connector name (package.json's name ?)
          scopes
        },
        onRegistered
      }
    })

    return cozy.authorize()
      .then((creds) => {
        fs.writeFileSync(tokenPath, JSON.stringify(creds))
        return {creds, scopes}
      })
  }
}

module.exports = authenticate
