import Minilog from '@cozy/minilog'
import { Q } from 'cozy-client'
import get from 'lodash/get'

const log = Minilog('getFileIfExists')

module.exports = getFileIfExists

async function getFileIfExists({ client, entry, options, folderPath, slug }) {
  const fileIdAttributes = options.fileIdAttributes
  const sourceAccountIdentifier = options.sourceAccountIdentifier

  const isReadyForFileMetadata =
    fileIdAttributes && slug && sourceAccountIdentifier
  if (isReadyForFileMetadata) {
    log.debug('Detecting file with metadata')
    const file = await getFileFromMetaData(
      client,
      entry,
      fileIdAttributes,
      sourceAccountIdentifier,
      slug
    )
    if (!file) {
      // no file with correct metadata, maybe the corresponding file already exist in the default
      // path from a previous version of the connector
      log.debug('Rolling back on detection by filename')
      return getFileFromPath(client, entry, folderPath)
    } else {
      return file
    }
  } else {
    log.debug('Rolling back on detection by filename')
    return getFileFromPath(client, entry, folderPath)
  }
}

async function getFileFromMetaData(
  client,
  entry,
  fileIdAttributes,
  sourceAccountIdentifier,
  slug
) {
  log.debug(
    `Checking existence of ${calculateFileKey(entry, fileIdAttributes)}`
  )
  const files = await client.queryAll(
    Q('io.cozy.files')
      .where({
        metadata: {
          fileIdAttributes: calculateFileKey(entry, fileIdAttributes)
        },
        trashed: false,
        cozyMetadata: {
          sourceAccountIdentifier,
          createdByApp: slug
        }
      })
      .indexFields([
        'metadata.fileIdAttributes',
        'trashed',
        'cozyMetadata.sourceAccountIdentifier',
        'cozyMetadata.createdByApp'
      ])
  )
  if (files && files[0]) {
    if (files.length > 1) {
      log.warn(
        `Found ${files.length} files corresponding to ${calculateFileKey(
          entry,
          fileIdAttributes
        )}`
      )
    }
    return files[0]
  } else {
    log.debug('File not found')
    return false
  }
}

async function getFileFromPath(client, entry, folderPath) {
  try {
    log.debug(`Checking existence of ${getFilePath({ entry, folderPath })}`)
    const result = await client
      .collection('io.cozy.files')
      .statByPath(getFilePath({ entry, folderPath }))
    return result.data
  } catch (err) {
    log.debug(err.message)
    return false
  }
}

function getFilePath({ file, entry, folderPath }) {
  if (file) {
    return folderPath + '/' + getAttribute(file, 'name')
  } else if (entry) {
    return folderPath + '/' + getFileName(entry)
  }
}

function getAttribute(obj, attribute) {
  return get(obj, `attributes.${attribute}`, get(obj, attribute))
}

function calculateFileKey(entry, fileIdAttributes) {
  return fileIdAttributes
    .sort()
    .map(key => get(entry, key))
    .join('####')
}

function getFileName(entry) {
  let filename
  if (entry.filename) {
    filename = entry.filename
  } else {
    log.error('Could not get a file name for the entry')
    return false
  }
  return sanitizeFileName(filename)
}

function sanitizeFileName(filename) {
  return filename.replace(/^\.+$/, '').replace(/[/?<>\\:*|":]/g, '')
}
