const fs = require('fs')
const path = require('path')
const log = require('../libs/logger').namespace('cozy-client-js-stub')
const uuid = require('uuid/v5')
const sha1 = require('uuid/lib/sha1')
const bytesToUuid = require('uuid/lib/bytesToUuid')
let fixture = {}
const FIXTURE_PATH = path.resolve('fixture.json')
if (fs.existsSync(FIXTURE_PATH)) {
  log('debug', `Found ${FIXTURE_PATH} fixture file`)
  fixture = require(FIXTURE_PATH)
}

module.exports = {
  data: {
    create (doctype, item) {
      log('info', item, `creating ${doctype}`)
      const ns = bytesToUuid(sha1(doctype))
      const _id = uuid(JSON.stringify(item), ns).replace(/-/gi, '')
      return Promise.resolve(Object.assign({}, item, {_id}))
    },
    updateAttributes (doctype, id, attrs) {
      log('info', attrs, `updating ${id} in ${doctype}`)
      return Promise.resolve({})
    },
    defineIndex (doctype) {
      return Promise.resolve({doctype})
    },
    query (index) {
      let result = null
      if (fixture[index.doctype]) {
        result = fixture[index.doctype]
      } else {
        result = []
      }
      return Promise.resolve(result)
    },
    delete () {
      return Promise.resolve({})
    },
    find (doctype, id) {
      // Find the doc in the fixture
      // exeption for "io.cozy.accounts" doctype where we return env_fields.json content
      let result = null
      if (doctype === 'io.cozy.accounts') {
        const config = require('./init-konnector-config')()
        result = {auth: config.fields}
      } else {
        return Promise.reject(new Error('find is not implemented yet in cozy-client-js stub'))
      }
      return Promise.resolve(result)
    }
  },
  files: {
    statByPath (pathToCheck) {
      // check this path in .
      return new Promise((resolve, reject) => {
        log('debug', `Checking if ${pathToCheck} exists`)
        const realpath = path.join('.', pathToCheck)
        log('debug', `Real path : ${realpath}`)
        if (fs.existsSync(realpath)) {
          resolve({_id: pathToCheck})
        } else {
          throw new Error(`${pathToCheck} does not exist`)
        }
      })
    },
    statById (idToCheck) {
      // just return the / path for dev purpose
      return Promise.resolve({attributes: {path: '/'}})
    },
    create (file, options) {
      return new Promise((resolve, reject) => {
        log('debug', `Creating new file ${options.name}`)
        const finalPath = path.join('.', options.dirID, options.name)
        log('debug', `Real path : ${finalPath}`)
        let writeStream = fs.createWriteStream(finalPath)
        file.pipe(writeStream)

        file.on('end', () => {
          log('info', `File ${finalPath} created`)
          resolve({_id: options.name})
        })

        writeStream.on('error', err => {
          log('warning', `Error : ${err} while trying to write file`)
          reject(new Error(err))
        })
      })
    },
    createDirectory (options) {
      return new Promise(resolve => {
        log('info', `Creating new directory ${options.name}`)
        const finalPath = path.join('.', options.dirID, options.name)
        log('info', `Real path : ${finalPath}`)
        fs.mkdirSync(finalPath)
        resolve()
      })
    }
  }
}
