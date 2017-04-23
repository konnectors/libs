const fs = require('fs')
const path = require('path')
const log = require('debug')('cozy-client-js-stub')
let fixture = {}
const FIXTURE_PATH = path.resolve('data/fixture.json')
if (fs.existsSync(FIXTURE_PATH)) {
  log(`Found ${FIXTURE_PATH} fixture file`)
  fixture = require(FIXTURE_PATH)
}

module.exports = {
  data: {
    create (doctype, item) {
      log(item, `creating ${doctype}`)
      return Promise.resolve(item)
    },
    updateAttributes (doctype, id, attrs) {
      log(attrs, `updating ${id} in ${doctype}`)
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
        const FIELDS_PATH = path.resolve('data/env_fields.json')
        result = {auth: require(FIELDS_PATH)}
      } else {
        return Promise.reject(new Error('find is not implemented yet in cozy-client-js stub'))
      }
      return Promise.resolve(result)
    }
  },
  files: {
    statByPath (pathToCheck) {
      // check this path in ./data
      return new Promise((resolve, reject) => {
        log(`Checking if ${pathToCheck} exists`)
        const realpath = path.join('./data', pathToCheck)
        log(`Real path : ${realpath}`)
        if (fs.existsSync(realpath)) {
          resolve({_id: pathToCheck})
        } else {
          reject(new Error(`${pathToCheck} does not exist`))
        }
      })
    },
    create (file, options) {
      return new Promise((resolve, reject) => {
        log(`Creating new file ${options.name}`)
        const finalPath = path.join('./data', options.dirID, options.name)
        log(`Real path : ${finalPath}`)
        let writeStream = fs.createWriteStream(finalPath)
        file.pipe(writeStream)

        file.on('end', () => {
          log(`File ${finalPath} created`)
          resolve()
        })

        writeStream.on('error', err => {
          log(`Error : ${err}`)
          reject(new Error(err))
        })
      })
    },
    createDirectory (options) {
      return new Promise((resolve, reject) => {
        log(`Creating new directory ${options.name}`)
        const finalPath = path.join('./data', options.dirID, options.name)
        log(`Real path : ${finalPath}`)
        let result = fs.mkdir(finalPath)
        if (result) resolve()
        else reject(new Error(`Could not create ${finalPath}`))
      })
    }
  }
}
