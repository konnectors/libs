var isWithinRange = require('date-fns/is_within_range')
var differenceInHours = require('date-fns/difference_in_hours')
var { getIdentifiers, getDateRange, getAmountRange, getBillDate, getBillAmount } = require('./getterHelper')

const assert = (pred, msg) => { if (!pred) { throw new Error(msg) } }

const filterByIdentifiers = (operations, identifiers) => {
  assert(Array.isArray(operations),
    'filterByIdentifiers cannot be called without "operations" array.'
  )
  assert(Array.isArray(identifiers),
    'filterByIdentifiers cannot be called without "identifiers" array.'
  )

  return operations.filter(operation => {
    let hasIdentifier = false
    for (const identifier of identifiers) {
      if (operation.label.toLowerCase().indexOf(identifier) >= 0) {
        hasIdentifier = true
      }
    }
    return hasIdentifier
  })
}

const filterByDates = (operations, startDate, endDate) => {
  assert(Array.isArray(operations),
    'filterByDates cannot be called without "operations" array.'
  )
  assert(startDate instanceof Date,
    'filterByDates cannot be called without valid "startDate" date.'
  )
  assert(endDate instanceof Date,
    'filterByDates cannot be called without valid "endDate" date.'
  )

  return operations.filter(operation => {
    return isWithinRange(operation.date, startDate, endDate)
  })
}

const filterByAmount = (operations, startAmount, endAmount) => {
  assert(Array.isArray(operations),
    'filterByAmount cannot be called without "operations" array.'
  )
  assert(typeof startAmount === 'number',
    'filterByAmount cannot be called without valid "startAmount" Number.'
  )
  assert(typeof endAmount === 'number',
    'filterByAmount cannot be called without valid "endAmount" Number.'
  )

  return operations.filter(operation => {
    return operation.amount >= startAmount && operation.amount <= endAmount
  })
}

const order = (bill, operations) => {
  // it's not possible to sort with 2 parameters, so we create a weight list
  // with date diff & amount diff. I choise weight with 0.7 because date is more
  // important, but this value is random.
  const weight = 0.7
  const dateW = weight
  const amountW = 1 - weight

  const weights = {}
  for (const operation of operations) {
    const dateDiff = Math.abs(differenceInHours(getBillDate(bill), operation.date))
    const amountDiff = Math.abs(getBillAmount(bill) - operation.amount)
    weights[operation._id] = dateW * dateDiff + amountW * amountDiff
  }

  operations = operations.sort((a, b) => {
    if (weights[b._id] === weights[a._id]) return 0
    return weights[a._id] > weights[b._id] ? 1 : -1
  })

  return operations
}

const operationsFilters = (bill, operations, options) => {
  const identifiers = getIdentifiers(options)
  operations = filterByIdentifiers(operations, identifiers)

  const { minDate, maxDate } = getDateRange(bill, options)
  operations = filterByDates(operations, minDate, maxDate)

  const { minAmount, maxAmount } = getAmountRange(bill, options)
  operations = filterByAmount(operations, minAmount, maxAmount)

  return operations
}

module.exports = {filterByIdentifiers, filterByDates, filterByAmount, order, operationsFilters}
