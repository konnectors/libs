const fs = require('fs')
const path = require('path')
const log = require('cozy-logger').namespace('cozy-client-js-stub')
const uuid = require('uuid/v5')
const sha1 = require('uuid/lib/sha1')
const bytesToUuid = require('uuid/lib/bytesToUuid')
const mimetypes = require('mime-types')
const rootPath = JSON.parse(
  process.env.COZY_FIELDS || '{"folder_to_save": "."}'
).folder_to_save
if (!fs.existsSync(rootPath)) fs.mkdirSync(rootPath)

let fixture = {}
const FIXTURE_PATH = path.resolve('fixture.json')
if (fs.existsSync(FIXTURE_PATH)) {
  log('debug', `Found ${FIXTURE_PATH} fixture file`)
  fixture = require(FIXTURE_PATH)
}

let DUMP_PATH = 'importedData.json'
const KONNECTOR_DEV_CONFIG_PATH = path.resolve('konnector-dev-config.json')
if (fs.existsSync(KONNECTOR_DEV_CONFIG_PATH)) {
  const KONNECTOR_DEV_CONFIG = require(KONNECTOR_DEV_CONFIG_PATH)
  DUMP_PATH = path.join(
    KONNECTOR_DEV_CONFIG.fields.folderPath || './data',
    DUMP_PATH
  )
}
// Truncate dump file
fs.writeFileSync(DUMP_PATH, '[]', 'utf8')

function loadImportedDataJSON() {
  let docStore = []
  if (fs.existsSync(DUMP_PATH)) {
    docStore = JSON.parse(fs.readFileSync(DUMP_PATH, 'utf8'))
  }

  return docStore
}

function dumpJSON(data) {
  return JSON.stringify(data, null, 2)
}

module.exports = {
  fetchJSON() {
    return Promise.resolve({
      rows: []
    })
  },
  data: {
    create(doctype, item) {
      log('info', item, `creating ${doctype}`)
      const ns = bytesToUuid(sha1(doctype))
      const _id = uuid(dumpJSON(item), ns).replace(/-/gi, '')

      // Dump created data in the imported data JSON dump
      const docStore = loadImportedDataJSON(doctype)
      const obj = { ...item, _id, doctype }
      docStore.push(obj)
      fs.writeFileSync(DUMP_PATH, dumpJSON(docStore), 'utf8')

      return Promise.resolve(obj)
    },
    updateAttributes(doctype, id, attrs) {
      log('info', attrs, `updating ${id} in ${doctype}`)

      // Update the imported data JSON dump
      const docStore = loadImportedDataJSON()
      const index = docStore.findIndex(function(item) {
        return item._id === id
      })
      let obj = {}
      if (index > -1) {
        obj = Object.assign(docStore[index], attrs, { _id: id })
        docStore[index] = obj
      } else {
        obj = Object.assign({}, attrs, { _id: id })
      }
      fs.writeFileSync(DUMP_PATH, dumpJSON(docStore), 'utf8')
      return Promise.resolve(obj)
    },
    defineIndex(doctype) {
      return Promise.resolve({ doctype })
    },
    query(index) {
      let result = null
      if (fixture[index.doctype]) {
        result = fixture[index.doctype]
      } else {
        result = []
      }
      return Promise.resolve(result)
    },
    findAll(doctype) {
      let result = null
      if (fixture[doctype]) {
        result = fixture[doctype]
      } else {
        result = []
      }
      return Promise.resolve(result)
    },
    delete() {
      return Promise.resolve({})
    },
    find(doctype, id) {
      // Find the doc in the fixture
      // exeption for "io.cozy.accounts" doctype where we return konnector-dev-config.json content
      let result = null
      if (doctype === 'io.cozy.accounts') {
        const configPath = path.resolve('konnector-dev-config.json')
        const config = require(configPath)
        result = { auth: config.fields }
      } else {
        return Promise.reject(
          new Error('find is not implemented yet in cozy-client-js stub')
        )
      }
      return Promise.resolve(result)
    },
    listReferencedFiles() {
      return Promise.resolve([])
    },
    addReferencedFiles() {
      return Promise.resolve({})
    }
  },
  files: {
    statByPath(pathToCheck) {
      // check this path in .
      return new Promise((resolve, reject) => {
        log('debug', `Checking if ${pathToCheck} exists`)
        if (pathToCheck === '/') return resolve({ _id: '.' })
        const realpath = path.join(rootPath, pathToCheck)
        log('debug', `Real path : ${realpath}`)
        if (fs.existsSync(realpath)) {
          resolve({ _id: pathToCheck })
        } else {
          const err = new Error(`${pathToCheck} does not exist`)
          err.status = 404
          reject(err)
        }
      })
    },
    statById(idToCheck) {
      // just return the / path for dev purpose
      return Promise.resolve({ attributes: { path: '/' } })
    },
    create(file, options) {
      return new Promise((resolve, reject) => {
        log('debug', `Creating new file ${options.name}`)
        const finalPath = path.join(rootPath, options.dirID, options.name)
        log('debug', `Real path : ${finalPath}`)
        let writeStream = fs.createWriteStream(finalPath)
        file.pipe(writeStream)

        file.on('end', () => {
          log('info', `File ${finalPath} created`)
          const extension = path.extname(options.name).substr(1)
          resolve({
            _id: options.name,
            attributes: {
              mime: mimetypes.lookup(extension),
              name: options.name
            }
          })
        })

        writeStream.on('error', err => {
          log('warn', `Error : ${err} while trying to write file`)
          reject(new Error(err))
        })
      })
    },
    createDirectory(options) {
      return new Promise(resolve => {
        log('info', `Creating new directory ${options.name}`)
        const finalPath = path.join(rootPath, options.dirID, options.name)
        const returnPath = path.join(options.dirID, options.name)
        log('info', `Real path : ${finalPath}`)
        fs.mkdirSync(finalPath)
        resolve({ _id: returnPath, path: returnPath })
      })
    }
  }
}
