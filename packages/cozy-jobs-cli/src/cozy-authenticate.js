#!/usr/bin/env node

/* eslint no-console: off */

const http = require('http')
const fs = require('fs')
const log = require('cozy-logger').namespace('cozy-authenticate')

// to allow cozy-stack-client to work
require('isomorphic-fetch')
global.URL = require('url').URL
global.btoa = require('btoa')
const { OAuthClient } = require('cozy-stack-client')

const manifest = require('./manifest')

const cozyURL = process.env.COZY_URL
  ? process.env.COZY_URL
  : 'http://cozy.tools:8080'
log('debug', cozyURL, 'COZY_URL')

// check if we have a token file
// if any return a promise with the credentials

function onRegistered(client, url) {
  let server
  return new Promise(resolve => {
    server = http.createServer((request, response) => {
      if (request.url.indexOf('/do_access') === 0) {
        log('debug', request.url, 'url received')
        resolve(request.url)
        response.end(
          'Authorization registered, you can close this page and go back to the cli'
        )
      }
    })
    server.listen(3333, () => {
      require('opn')(url, { wait: false })
      console.log(
        'A new tab just opened in your browser to require the right authorizations for this connector in your cozy. Waiting for it...'
      )
      console.log(
        'If your browser does not open (maybe your are in a headless virtual machine...), then paste this url in your browser'
      )
      console.log(url)
    })
  }).then(
    url => {
      server.close()
      return url
    },
    err => {
      server.close()
      log('error', err, 'registration error')
      throw err
    }
  )
}

async function authenticate({ manifestPath, tokenPath }) {
  const scopes = manifest.getScopes(manifestPath)
  if (fs.existsSync(tokenPath)) {
    log('debug', 'token file already present')
    const creds = JSON.parse(fs.readFileSync(tokenPath))
    return { creds, scopes }
  } else {
    const cozy = new OAuthClient({
      uri: cozyURL,
      oauth: {
        client_name: manifest.getSlug(manifestPath),
        software_id: 'foobar',
        redirect_uris: 'http://localhost:3333/do_access'
      },
      scopes
    })

    const client = await cozy.register()
    const stateCode = cozy.generateStateCode()
    const url = cozy.getAuthCodeURL(stateCode, scopes)

    const urlAccess = await onRegistered(cozy, url)
    const accessCode = cozy.getAccessCodeFromURL(cozyURL + urlAccess, stateCode)
    const token = await cozy.fetchAccessToken(accessCode)

    fs.writeFileSync(tokenPath, JSON.stringify({ client, token }))
    return { creds: { client, token }, scopes }
  }
}

module.exports = authenticate
