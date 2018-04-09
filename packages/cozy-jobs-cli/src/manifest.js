const fs = require('fs')
const log = require('cozy-logger').namespace('manifest')

module.exports = {
  getScopes (manifestPath) {
    // get the permissions from the manifest.konnector file
    const permissions = getManifest(manifestPath).permissions

    // convert the permissions into scopes
    let scopes = []
    for (let key in permissions) {
      scopes.push(permissions[key].type)
    }
    log('debug', scopes, 'scopes found')

    return scopes
  },
  getSlug (manifestPath) {
    return getManifest(manifestPath).slug
  }
}

function getManifest (manifestPath) {
  return JSON.parse(fs.readFileSync(manifestPath))
}
