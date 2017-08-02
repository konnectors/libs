const fs = require('fs')
const path = require('path')
const uuid = require('uuid/v5')
const sha1 = require('uuid/lib/sha1')
const bytesToUuid = require('uuid/lib/bytesToUuid')

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
      const ns = bytesToUuid(sha1(doctype))
      const _id = uuid(JSON.stringify(item), ns).replace(/-/gi, '')
      return Promise.resolve(Object.assign({}, item, {_id}))
    },
    updateAttributes (doctype, id, attrs) {
      log(attrs, `updating ${id} in ${doctype}`)
      return Promise.resolve(Object.assign({}, attrs, {_id: id}))
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
        if (!fs.existsSync(FIELDS_PATH)) {
          console.log(`Fields file not found : ${FIELDS_PATH} Please copy the ${FIELDS_PATH}.template file and fill the credentials`)
          process.exit(0)
        }
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
    statById (idToCheck) {
      // just return the / path for dev purpose
      return Promise.resolve({attributes: {path: '/'}})
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
          resolve({_id: options.name})
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
