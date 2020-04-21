const fs = require('fs')
const path = require('path')
const log = require('cozy-logger').namespace('cozy-client-js-stub')
const mimetypes = require('mime-types')
const low = require('lowdb')
const lodashId = require('lodash-id')
const get = require('lodash/get')
const FileSync = require('lowdb/adapters/FileSync')
const rawBody = require('raw-body')
const stripJsonComments = require('strip-json-comments')
const manifest = require('../libs/manifest')

const rootPath = JSON.parse(
  process.env.COZY_FIELDS || '{"folder_to_save": "."}'
).folder_to_save

let db = setUpDb()

function setDefaults(doctype) {
  const defaults = {
    'io.cozy.files': []
  }
  if (doctype) defaults[doctype] = []
  db.defaults(defaults).write()
}

module.exports = {
  _setDb(newDb) {
    db = newDb
  },
  fetchJSON() {
    return Promise.resolve({
      rows: []
    })
  },
  data: {
    create(doctype, item) {
      setDefaults(doctype)
      const doc = db
        .get(doctype)
        .insert(item)
        .write()

      return Promise.resolve(doc)
    },
    update(doctype, doc, changes) {
      setDefaults(doctype)
      db.get(doctype)
        .updateById(doc._id, changes)
        .write()
      return Promise.resolve(doc)
    },
    updateAttributes(doctype, id, attrs) {
      setDefaults(doctype)
      const doc = db
        .get(doctype)
        .updateById(id, attrs)
        .write()
      return Promise.resolve(doc)
    },
    defineIndex(doctype) {
      return Promise.resolve({ doctype })
    },
    query(index, options) {
      // this stub only supposes that there are keys defined in options.selectors
      // this is only needed by the hydrateAndFilter function
      // supporting all mango selectors is not planned here
      const { doctype } = index
      setDefaults(doctype)
      const { selector } = options

      let result = db
        .get(doctype)
        .filter(selector)
        .value()

      if (options.wholeResponse) {
        result = { docs: result }
      }
      return Promise.resolve(result)
    },
    findAll(doctype) {
      setDefaults(doctype)
      return Promise.resolve(db.get(doctype).value())
    },
    delete(doctype, doc) {
      setDefaults(doctype)
      const result = db
        .get(doctype)
        .removeById(doc._id)
        .write()
      return Promise.resolve(result)
    },
    find(doctype, id) {
      setDefaults(doctype)
      let result = db
        .get(doctype)
        .getById(id)
        .value()
      const accountExists = Boolean(result)
      if (doctype === 'io.cozy.accounts') {
        const configPath = path.resolve('konnector-dev-config.json')
        const config = JSON.parse(
          stripJsonComments(fs.readFileSync(configPath, 'utf8'))
        )
        result = { _id: id, ...result, auth: config.fields }
        if (!accountExists) {
          this.create(doctype, result)
        } else {
          this.update(doctype, result, result)
        }
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
      setDefaults()
      // check this path in .
      return new Promise((resolve, reject) => {
        log('debug', `Checking if ${pathToCheck} exists`)
        if (pathToCheck === '/') return resolve({ _id: '.' })
        const realpath = path.join(rootPath, pathToCheck)
        log('debug', `Real path : ${realpath}`)
        if (fs.existsSync(realpath)) {
          const extension = path.extname(pathToCheck).substr(1)

          const doc = db
            .get('io.cozy.files')
            .getById(pathToCheck.split('/').pop())
            .value()

          if (!doc) {
            resolve({
              _id: removeFirstSlash(pathToCheck),
              attributes: {
                mime: mimetypes.lookup(extension),
                name: pathToCheck,
                size: fs.statSync(realpath).size
              }
            })
          } else {
            resolve(doc)
          }
        } else {
          const err = new Error(`${pathToCheck} does not exist`)
          err.status = 404
          reject(err)
        }
      })
    },
    statById(id) {
      setDefaults()
      const doc = db
        .get('io.cozy.files')
        .getById(id)
        .value()

      if (doc) {
        return doc
      } else {
        return Promise.resolve({ attributes: { path: '/' } })
      }
    },
    async updateById(id, file, options) {
      setDefaults()
      await removeFile(id)
      return createFile(file, options)
    },

    async updateAttributesById(id, attrs) {
      setDefaults()
      const doc = db
        .get('io.cozy.files')
        .getById(id)
        .value()

      if (doc) {
        if (attrs.name && attrs.name !== get(doc, 'attributes.name')) {
          await renameFile(id, attrs.name)
        }
        doc.attributes = { ...doc.attributes, ...attrs }
        db.get('io.cozy.files')
          .updateById(id, doc)
          .write()
      }
    },

    create(file, options) {
      setDefaults()
      return createFile(file, options)
    },
    createDirectory(options) {
      setDefaults()
      return new Promise(resolve => {
        log('debug', `Creating new directory ${options.name}`)
        const finalPath = path.join(rootPath, options.dirID, options.name)
        const returnPath = path.join(options.dirID, options.name)
        log('debug', `Real path : ${finalPath}`)
        try {
          fs.mkdirSync(finalPath)
        } catch (err) {
          // directory already exists
        }
        resolve({ _id: returnPath, path: returnPath })
      })
    },
    downloadByPath(filePath) {
      setDefaults()
      return this.downloadById(filePath)
    },
    downloadById(fileId) {
      setDefaults()
      const fileInDb = db
        .get('io.cozy.files')
        .getById(fileId)
        .value()
      let fileName
      if (fileInDb) {
        fileName = fileInDb.attributes.name
      } else throw new Error('could not find the file')
      const realpath = path.join(rootPath, fileName)
      const stream = fs.createReadStream(realpath)
      return {
        body: stream,
        buffer: () => rawBody(stream)
      }
    },
    trashById(fileId) {
      setDefaults()
      return removeFile(fileId)
    },
    destroyById() {
      setDefaults()
      // there is no trash with the stub
      return Promise.resolve()
    }
  }
}

async function removeFile(fileId) {
  const file = db
    .get('io.cozy.files')
    .getById(fileId)
    .value()
  db.get('io.cozy.files')
    .removeById(fileId)
    .write()
  const realpath = path.join(rootPath, file.dir_id, file.attributes.name)
  fs.unlinkSync(realpath)
}

async function renameFile(fileId, newName) {
  const doc = db
    .get('io.cozy.files')
    .getById(fileId)
    .write()
  const oldPath = path.join(rootPath, doc.dir_id, doc.attributes.name)
  const newPath = path.join(rootPath, doc.dir_id, newName)
  fs.renameSync(oldPath, newPath)
}

function setUpDb() {
  let DUMP_PATH = 'importedData.json'
  const KONNECTOR_DEV_CONFIG_PATH = path.resolve('konnector-dev-config.json')
  if (fs.existsSync(KONNECTOR_DEV_CONFIG_PATH)) {
    const KONNECTOR_DEV_CONFIG = JSON.parse(
      fs.readFileSync(KONNECTOR_DEV_CONFIG_PATH, 'utf-8')
    )
    DUMP_PATH = path.join(
      KONNECTOR_DEV_CONFIG.fields.folderPath || rootPath,
      DUMP_PATH
    )
  }

  const db = low(new FileSync(DUMP_PATH))
  db._.mixin(lodashId)
  db._.id = '_id'
  return db
}

function removeFirstSlash(pathToCheck) {
  if (pathToCheck[0] === '/') {
    return pathToCheck.substr(1)
  }
  return pathToCheck
}

function createFile(file, options = {}) {
  return new Promise((resolve, reject) => {
    log('debug', `Creating new file ${options.name}`)
    const finalPath = path.join(rootPath, options.dirID, options.name)
    log('debug', `Real path : ${finalPath}`)
    const extension = path.extname(options.name).substr(1)
    const mime = mimetypes.lookup(extension)

    const fileDoc = {
      _id: get(options, 'metadata.fileIdAttributes') || options.name,
      dir_id: options.dirID || '.',
      metadata: options.metadata,
      trashed: false,
      attributes: {
        mime,
        name: options.name
      },
      cozyMetadata: {
        sourceAccount: options.sourceAccount,
        sourceAccountIdentifier: options.sourceAccountIdentifier,
        createdByApp: manifest.data.slug
      }
    }

    if (file.pipe) {
      let writeStream = fs.createWriteStream(finalPath)
      file.pipe(writeStream)

      file.on('end', () => {
        log('debug', `File ${finalPath} created`)
        addFileSizeAndWrite(fileDoc, finalPath)
        resolve(fileDoc)
      })
      writeStream.on('error', err => {
        log('warn', `Error : ${err} while trying to write file`)
        reject(new Error(err))
      })
    } else {
      // file is a string
      fs.writeFileSync(finalPath, file)
      addFileSizeAndWrite(fileDoc, finalPath)
      resolve(fileDoc)
    }

    function addFileSizeAndWrite(doc, filePath) {
      doc.attributes.size = fs.statSync(filePath).size
      db.get('io.cozy.files')
        .insert(doc)
        .write()
    }
  })
}
