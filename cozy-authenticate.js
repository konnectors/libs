#!/usr/bin/env node

const http = require('http')
const path = require('path')
const fs = require('fs')
const log = require('debug')('gettoken')
const {Client, MemoryStorage} = require('cozy-client-js')
const manifest = require('./manifest')

// only genereate the token file if it does not already exist
const TOKEN_PATH = path.join(__dirname, '../data/token.json')
if (fs.existsSync(TOKEN_PATH)) {
  log(`${TOKEN_PATH} already present`)
  process.exit(0)
}

const cozyURL = process.env.COZY_URL ? process.env.COZY_URL : 'http://cozy.tools:8080'
log(cozyURL, 'cozyURL')

let manifestPath = process.argv[2]
if (manifestPath) {
  manifestPath = path.resolve(manifestPath)
} else {
  console.log(`
Manifest file not found : ${manifestPath}

Please use this command like this :

cozy-authenticate MANIFEST_PATH

Where MANIFEST_PATH is the path to a konnector manifest : manifest.konnectors
`)
  process.exit(0)
}

const scopes = manifest.getScopes(manifestPath)

function onRegistered (client, url) {
  let server
  return new Promise((resolve) => {
    server = http.createServer((request, response) => {
      if (request.url.indexOf('/do_access') === 0) {
        log(request.url, 'url received')
        resolve(request.url)
        response.end()
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
    log(err, 'registration error')
    throw err
  })
}

const cozy = new Client({
  cozyURL,
  oauth: {
    storage: new MemoryStorage(),
    clientParams: {
      redirectURI: 'http://localhost:3333/do_access',
      softwareID: 'foobar',
      clientName: 'client',
      scopes: scopes
    },
    onRegistered: onRegistered
  }
})

cozy.authorize().then((creds) => {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(creds))
  log(TOKEN_PATH, 'file saved')
  process.exit()
})
