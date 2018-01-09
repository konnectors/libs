const log = require('../../logger').namespace('operationsFilters')
var isWithinRange = require('date-fns/is_within_range')
var differenceInHours = require('date-fns/difference_in_hours')
var { getIdentifiers, getDateRange, getAmountRange, getBillDate, getBillAmount } = require('./getterHelper')

export const filterByIdentifiers = (operations, identifiers) => {
  if (!Array.isArray(operations)) {
    throw new Error(
      'filterByIdentifiers cannot be called without "operations" array.'
    )
  }
  if (!Array.isArray(identifiers)) {
    throw new Error(
      'filterByIdentifiers cannot be called without "identifiers" array.'
    )
  }

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

export const filterByDates = (operations, startDate, endDate) => {
  if (!Array.isArray(operations)) {
    throw new Error(
      'filterByDates cannot be called without "operations" array.'
    )
  }
  if (!(startDate instanceof Date)) {
    log('warn', `typeof startDate: ${typeof startDate} = ${startDate}`)
    throw new Error(
      'filterByDates cannot be called without valid "startDate" date.'
    )
  }
  if (!(endDate instanceof Date)) {
    log('warn', `typeof endDate: ${typeof endDate} = ${endDate}`)
    throw new Error(
      'filterByDates cannot be called without valid "endDate" date.'
    )
  }

  return operations.filter(operation => {
    return isWithinRange(operation.date, startDate, endDate)
  })
}

export const filterByAmount = (operations, startAmount, endAmount) => {
  if (!Array.isArray(operations)) {
    throw new Error(
      'filterByAmount cannot be called without "operations" array.'
    )
  }
  if (!(typeof startAmount === 'number')) {
    throw new Error(
      'filterByAmount cannot be called without valid "startAmount" Number.'
    )
  }
  if (!(typeof endAmount === 'number')) {
    throw new Error(
      'filterByAmount cannot be called without valid "endAmount" Number.'
    )
  }

  return operations.filter(operation => {
    return operation.amount >= startAmount && operation.amount <= endAmount
  })
}

export const order = (bill, operations) => {
  // it's not possible to sort with 2 parameters, so we create a weight list
  // with date diff & amount diff. I choise weight with 0.8 because date is more
  // important, but this value is ramdom.

  // P : donner un poid pour les dates : 0.8
  //     comme le montant est en génral identique le paramettre est moins important
  // = P * nombre jour + (1 - P) ecart du montant
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

export const operationsFilters = (bill, operations, options) => {
  const identifiers = getIdentifiers(options)
  operations = filterByIdentifiers(operations, identifiers)

  const { minDate, maxDate } = getDateRange(bill, options)
  operations = filterByDates(operations, minDate, maxDate)

  const { minAmount, maxAmount } = getAmountRange(bill, options)
  operations = filterByAmount(operations, minAmount, maxAmount)

  return operations
}
