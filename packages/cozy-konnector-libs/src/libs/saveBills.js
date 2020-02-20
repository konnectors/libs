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
 *   + `contractId` (String): Contract unique identicator used to deduplicate bills
 *   + `contractLabel`: (String) User label if define, must be used with contractId
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
const saveBills = async (inputEntries, fields, inputOptions = {}) => {
  // Cloning input arguments since both entries and options are expected
  // to be modified by functions called inside saveBills.
  const entries = _.cloneDeep(inputEntries)
  const options = _.cloneDeep(inputOptions)

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
  let tempEntries
  tempEntries = manageContractsData(entries, options)
  tempEntries = await saveFiles(tempEntries, fields, options)

  if (options.processPdf) {
    let moreEntries = []
    for (let entry of tempEntries) {
      if (entry.fileDocument) {
        let pdfContent
        try {
          pdfContent = await utils.getPdfText(entry.fileDocument._id)

          // allow to create more entries related to the same file
          const result = await options.processPdf(entry, pdfContent.text, pdfContent)
          if (result && result.length) moreEntries = [...moreEntries, ...result]
        } catch (err) {
          log(
            'warn',
            `processPdf: Failed to read pdf content in ${_.get(
              entry,
              'fileDocument.attributes.name'
            )}`
          )
          log('warn', err.message)
          entry.__ignore = true
        }
      }
    }
    if (moreEntries.length) tempEntries = [...tempEntries, ...moreEntries]
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
    .filter(entry => !entry.__ignore)
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

  checkRequiredAttributes(tempEntries)

  tempEntries = await hydrateAndFilter(tempEntries, DOCTYPE, options)
  tempEntries = await addData(tempEntries, DOCTYPE, options)
  if (options.linkBankOperations !== false) {
    tempEntries = await linkBankOperations(
      originalEntries,
      DOCTYPE,
      fields,
      options
    )
    log('debug', 'after linkbankoperation')
  }
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

function manageContractsData(tempEntries, options) {
  if (options.contractLabel && options.contractId === undefined) {
    log('warn', 'contractLabel used without contractId, ignoring it.')
    return tempEntries
  }

  let newEntries = tempEntries
  // if contractId passed by option
  if (options.contractId) {
    // Define contractlabel from contractId if not set in options
    if (!options.contractLabel) {
      options.contractLabel = options.contractId
    }
    // Set saving path from contractLabel
    options.subPath = options.contractLabel
    // Add contractId to deduplication keys
    addContractIdToDeduplication(options)
    // Add contract data to bills
    newEntries = newEntries.map(entry => addContractsDataToBill(entry, options))

    // if contractId passed by bill attribute
  } else if (billsHaveContractId(newEntries)) {
    // Add contractId to deduplication keys
    addContractIdToDeduplication(options)

    newEntries = newEntries.map(entry => mergeContractsDataInBill(entry))
    //manageContractsDataPassedByAttribute(newEntries, options
  }
  return newEntries
}

function addContractsDataToBill(entry, options) {
  entry.contractLabel = options.contractLabel
  entry.contractId = options.contractId
  return entry
}

function mergeContractsDataInBill(entry) {
  // Only treat bill with data
  if (entry.contractId) {
    // Surcharge label in needed
    if (!entry.contractLabel) {
      entry.contractLabel = entry.contractId
    }
    // Edit subpath of each bill according to contractLabel
    entry.subPath = entry.contractLabel
  }
  return entry
}

/* This function return true if at least one bill of entries has a contractId
 */
function billsHaveContractId(entries) {
  for (const entry of entries) {
    if (entry.contractId) {
      return true
    }
  }
  return false
}

/* Add contractId to deduplication keys
 */
function addContractIdToDeduplication(options) {
  if (options.keys) {
    options.keys.push('contractId')
  }
}

module.exports = saveBills
module.exports.manageContractsData = manageContractsData
