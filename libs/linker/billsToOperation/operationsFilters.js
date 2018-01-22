const every = require('lodash/every')
const includes = require('lodash/includes')
const some = require('lodash/some')
const isWithinRange = require('date-fns/is_within_range')

const { getIdentifiers, getDateRangeFromBill, getAmountRangeFromBill } = require('./helpers')

// constants

const HEALTH_VENDORS = ['Ameli', 'Harmonie', 'Malakoff Mederic', 'MGEN'] // TODO: to import from each konnector
const HEALTH_CAT_ID_OPERATION = '400610' // TODO: import it from cozy-bank

// helpers

const getCategoryId = o => o.manualCategoryId || o.automaticCategoryId

const isHealthOperation = operation => {
  return HEALTH_CAT_ID_OPERATION === getCategoryId(operation)
}

const isHealthBill = bill => {
  return includes(HEALTH_VENDORS, bill.vendor)
}

// filters

const filterByIdentifiers = identifiers => {
  identifiers = identifiers.map(i => i.toLowerCase())
  return operation => {
    const label = operation.label.toLowerCase()
    return some(identifiers, identifier => includes(label, identifier))
  }
}

const filterByDates = ({ minDate, maxDate }) => operation => {
  return isWithinRange(operation.date, minDate, maxDate)
}

const filterByAmounts = ({ minAmount, maxAmount }) => operation => {
  return operation.amount >= minAmount && operation.amount <= maxAmount
}

const filterByCategory = bill => operation => {
  return isHealthBill(bill)
    ? isHealthOperation(operation)
    : !isHealthOperation(operation)
}

// combine filters

const operationsFilters = (bill, operations, options) => {
  const filterByConditions = filters => op => {
    return every(filters.map(f => f(op)))
  }

  const fByDates = filterByDates(getDateRangeFromBill(bill, options))
  const fByAmounts = filterByAmounts(getAmountRangeFromBill(bill, options))
  const fByCategory = filterByCategory(bill)

  const conditions = [fByDates, fByAmounts, fByCategory]

  // We filters with identifiers when
  // - we search a credit operation
  // - or when is bill is in the health category
  if (options.credit || !isHealthBill(bill)) {
    const fbyIdentifiers = filterByIdentifiers(getIdentifiers(options))
    conditions.push(fbyIdentifiers)
  }

  return operations.filter(filterByConditions(conditions))
}

module.exports = {
  filterByIdentifiers,
  filterByDates,
  filterByAmounts,
  filterByCategory,
  operationsFilters
}
