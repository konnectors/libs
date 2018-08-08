/**
 * Combines the features of `saveFiles`, `filterData`, `addData` and `linkBankOperations` for a
 * common case: bills.
 * Will create `io.cozy.bills` objects. The default deduplication keys are `['date', 'amount', 'vendor']`.
 * You need the full permission on `io.cozy.bills`, full permission on `io.cozy.files` and also
 * full permission on `io.cozy.bank.operations` in your manifest, to be able to * use this function.
 *
 * Parameters:
 *
 * - `documents` is an array of objects with any attributes with some mandatory attributes :
 *   + `amount` (Number): the amount of the bill used to match bank operations
 *   + `date` (Date): the date of the bill also used to match bank operations
 *   + `vendor` (String): the name of the vendor associated to the bill. Ex: 'trainline'
 *   You can also pass attributes expected by `saveFiles`
 *   Please take a look at [io.cozy.bills doctype documentation](https://github.com/cozy/cozy-doctypes/blob/master/docs/io.cozy.bills.md)
 * - `fields` (object) this is the first parameter given to BaseKonnector's constructor
 * - `options` is passed directly to `saveFiles`, `hydrateAndFilter`, `addData` and `linkBankOperations`.
 *
 * ```javascript
 * const { BaseKonnector, saveBills } = require('cozy-konnector-libs')
 *
 * module.exports = new BaseKonnector(function fetch (fields) {
 *   const documents = []
 *   // some code which fills documents
 *   return saveBills(documents, fields, {
 *     identifiers: ['vendorj']
 *   })
 * })
 * ```
 *
 * @module  saveBills
 */

const saveFiles = require('./saveFiles')
const hydrateAndFilter = require('./hydrateAndFilter')
const addData = require('./addData')
const log = require('cozy-logger').namespace('saveBills')
const linkBankOperations = require('./linkBankOperations')
const DOCTYPE = 'io.cozy.bills'
const _ = require('lodash')
const { findDuplicates } = require('./utils')

const requiredAttributes = {
  date: 'isDate',
  amount: 'isNumber',
  vendor: 'isString'
}

// Encapsulate the saving of Bills : saves the files, saves the new data, and associate the files
// to an existing bank operation
module.exports = (entries, fields, options = {}) => {
  if (!_.isArray(entries) || entries.length === 0) {
    log('warn', 'saveBills: no bills to save')
    return Promise.resolve()
  }

  checkRequiredAttributes(entries)

  if (typeof fields === 'string') {
    fields = { folderPath: fields }
  }

  // Deduplicate on this keys
  options.keys = options.keys || Object.keys(requiredAttributes)

  options.postProcess = function(entry) {
    entry.currency = convertCurrency(entry.currency)
    if (entry.fileDocument) {
      entry.invoice = `io.cozy.files:${entry.fileDocument._id}`
    }
    delete entry.fileDocument
    return entry
  }

  const originalEntries = entries
  return saveFiles(entries, fields, options)
    .then(entries => hydrateAndFilter(entries, DOCTYPE, options))
    .then(entries => addData(entries, DOCTYPE, options))
    .then(() => linkBankOperations(originalEntries, DOCTYPE, fields, options))
    .then(() => cleanAlert(options.keys))
}

async function cleanAlert(keys) {
  const { toRemove } = await findDuplicates(DOCTYPE, { keys })
  if (toRemove.length) {
    log(
      'warn',
      `saveBills: there are ${
        toRemove.length
      } duplicated bills to remove according to ${keys.join(', ')} attributes`
    )
  }
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
