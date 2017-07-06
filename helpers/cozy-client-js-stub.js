const fs = require('fs')
const path = require('path')
const log = require('../libs/logger')
let fixture = {}
const FIXTURE_PATH = path.resolve('fixture.json')
if (fs.existsSync(FIXTURE_PATH)) {
  log('debug', `Found ${FIXTURE_PATH} fixture file`)
  fixture = require(FIXTURE_PATH)
}

module.exports = {
  data: {
    create (doctype, item) {
      log('debug', item, `creating ${doctype}`)
      return Promise.resolve(item)
    },
    updateAttributes (doctype, id, attrs) {
      log('debug', attrs, `updating ${id} in ${doctype}`)
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
          reject(new Error(`${pathToCheck} does not exist`))
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
          log('debug', `File ${finalPath} created`)
          resolve({_id: options.name})
        })

        writeStream.on('error', err => {
          log('debug', `Error : ${err} whil trying to write file`)
          reject(new Error(err))
        })
      })
    },
    createDirectory (options) {
      return new Promise((resolve, reject) => {
        log('debug', `Creating new directory ${options.name}`)
        const finalPath = path.join('.', options.dirID, options.name)
        log('debug', `Real path : ${finalPath}`)
        let result = fs.mkdir(finalPath)
        if (result) resolve()
        else reject(new Error(`Could not create ${finalPath}`))
      })
    }
  }
}
