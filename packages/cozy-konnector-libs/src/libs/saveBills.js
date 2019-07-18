/**
 * Encapsulates the saving of Bills : saves the files, saves the new data, and associate the files
 * to an existing bank operation
 *
 * @module saveBills
 */

const utils = require('./utils')
const saveFiles = require('./saveFiles')
const hydrateAndFilter = require('./hydrateAndFilter')
const addData = require('./addData')
const log = require('cozy-logger').namespace('saveBills')
const linkBankOperations = require('./linkBankOperations')
const DOCTYPE = 'io.cozy.bills'
const _ = require('lodash')
const manifest = require('./manifest')

const requiredAttributes = {
  date: 'isDate',
  amount: 'isNumber',
  vendor: 'isString'
}

/**
 * Combines the features of `saveFiles`, `hydrateAndFilter`, `addData` and `linkBankOperations` for a
 * common case: bills.
 * Will create `io.cozy.bills` objects. The default deduplication keys are `['date', 'amount', 'vendor']`.
 * You need the full permission on `io.cozy.bills`, full permission on `io.cozy.files` and also
 * full permission on `io.cozy.bank.operations` in your manifest, to be able to use this function.
 *
 * Parameters:
 *
 * - `documents` is an array of objects with any attributes with some mandatory attributes :
 *   + `amount` (Number): the amount of the bill used to match bank operations
 *   + `date` (Date): the date of the bill also used to match bank operations
 *   + `vendor` (String): the name of the vendor associated to the bill. Ex: 'trainline'
 *   + `currency` (String) default: EUR:  The ISO currency value (not mandatory since there is a
 *   default value.
 *   + `matchingCriterias` (Object): criterias that can be used by an external service to match bills
 *   with bank operations. If not specified but the 'banksTransactionRegExp' attribute is specified in the
 *   manifest of the connector, this value is automatically added to the bill
 *
 *   You can also pass attributes expected by `saveFiles` : fileurl, filename, requestOptions
 *   and more
 *
 *   Please take a look at [io.cozy.bills doctype documentation](https://github.com/cozy/cozy-doctypes/blob/master/docs/io.cozy.bills.md)
 * - `fields` (object) this is the first parameter given to BaseKonnector's constructor
 * - `options` is passed directly to `saveFiles`, `hydrateAndFilter`, `addData` and `linkBankOperations`.
 *
 * @example
 *
 * ```javascript
 * const { BaseKonnector, saveBills } = require('cozy-konnector-libs')
 *
 * module.exports = new BaseKonnector(function fetch (fields) {
 *   const documents = []
 *   // some code which fills documents
 *   return saveBills(documents, fields, {
 *     identifiers: ['vendor']
 *   })
 * })
 * ```
 *
 * @alias module:saveBills
 */
module.exports = async (entries, fields, options = {}) => {
  if (!_.isArray(entries) || entries.length === 0) {
    log('warn', 'saveBills: no bills to save')
    return Promise.resolve()
  }

  if (!options.sourceAccount) {
    log('warn', 'There is no sourceAccount given to saveBills')
  }

  if (!options.sourceAccountIdentifier) {
    log('warn', 'There is no sourceAccountIdentifier given to saveBills')
  }

  if (typeof fields === 'string') {
    fields = { folderPath: fields }
  }

  // Deduplicate on this keys
  options.keys = options.keys || Object.keys(requiredAttributes)

  const originalEntries = entries
  const defaultShouldUpdate = (entry, dbEntry) =>
    entry.invoice !== dbEntry.invoice ||
    !dbEntry.cozyMetadata ||
    !dbEntry.matchingCriterias

  if (!options.shouldUpdate) {
    options.shouldUpdate = defaultShouldUpdate
  } else {
    const fn = options.shouldUpdate
    options.shouldUpdate = (entry, dbEntry) => {
      return defaultShouldUpdate(entry, dbEntry) || fn(entry, dbEntry)
    }
  }

  let tempEntries = entries
  tempEntries = await saveFiles(tempEntries, fields, options)

  if (options.processPdf) {
    for (let entry of tempEntries) {
      if (entry.fileDocument) {
        let pdfContent
        try {
          pdfContent = await utils.getPdfText(entry.fileDocument._id)
          await options.processPdf(entry, pdfContent.text, pdfContent)
        } catch (err) {
          log(
            'warn',
            `processPdf: Failed to read pdf content in ${JSON.stringify(
              entry.fileDocument
            )}`
          )
          log('warn', err.message)
        }
      }
    }
  }

  // try to get transaction regexp from the manifest
  let defaultTransactionRegexp = null
  if (
    Object.keys(manifest.data).length &&
    manifest.data.banksTransactionRegExp
  ) {
    defaultTransactionRegexp = manifest.data.banksTransactionRegExp
  }

  tempEntries = tempEntries
    // we do not save bills without associated file anymore
    .filter(entry => entry.fileDocument)
    .map(entry => {
      entry.currency = convertCurrency(entry.currency)
      entry.invoice = `io.cozy.files:${entry.fileDocument._id}`
      const matchingCriterias = entry.matchingCriterias || {}
      if (defaultTransactionRegexp && !matchingCriterias.labelRegex) {
        matchingCriterias.labelRegex = defaultTransactionRegexp
        entry.matchingCriterias = matchingCriterias
      }
      delete entry.fileDocument
      delete entry.fileAttributes
      return entry
    })

  checkRequiredAttributes(entries)

  tempEntries = await hydrateAndFilter(tempEntries, DOCTYPE, options)
  tempEntries = await addData(tempEntries, DOCTYPE, options)
  if (options.linkBankOperations !== false) {
    tempEntries = await linkBankOperations(
      originalEntries,
      DOCTYPE,
      fields,
      options
    )
  }
  log('info', 'after linkbankoperation')
  return tempEntries
}

function convertCurrency(currency) {
  if (currency) {
    if (currency.includes('€')) {
      return 'EUR'
    } else if (currency.includes('$')) {
      return 'USD'
    } else if (currency.includes('£')) {
      return 'GBP'
    } else {
      return currency
    }
  } else {
    return 'EUR'
  }
}

function checkRequiredAttributes(entries) {
  for (let entry of entries) {
    for (let attr in requiredAttributes) {
      if (entry[attr] == null) {
        throw new Error(
          `saveBills: an entry is missing the required ${attr} attribute`
        )
      }
      const checkFunction = requiredAttributes[attr]
      const isExpectedType = _(entry[attr])[checkFunction]()
      if (isExpectedType === false) {
        throw new Error(
          `saveBills: an entry has a ${attr} which does not respect ${checkFunction}`
        )
      }
    }
  }
}
