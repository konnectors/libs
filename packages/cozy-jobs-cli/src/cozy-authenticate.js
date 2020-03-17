#!/usr/bin/env node

/* eslint no-console: off */
const { createClientInteractive } = require('cozy-client/dist/cli')
const manifest = require('./manifest')

async function authenticate({ manifestPath, tokenPath }) {
  const scopes = manifest.getScopes(manifestPath)

  // add account scope to allow eventual account creation for dev mode
  if (!scopes.includes('io.cozy.accounts')) {
    scopes.push('io.cozy.accounts')
  }

  const client = await createClientInteractive(
    {
      uri: process.env.COZY_URL
        ? process.env.COZY_URL
        : 'http://cozy.tools:8080',
      scope: scopes,
      oauth: {
        softwareID: 'dev-connector'
      }
    },
    {
      getSavedCredentials: () => tokenPath
    }
  )

  return client
}

module.exports = authenticate
