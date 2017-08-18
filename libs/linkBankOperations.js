const moment = require('moment')
const bluebird = require('bluebird')
const cozyClient = require('./cozyclient')
const DOCTYPE = 'io.cozy.bank.operations'
const log = require('./logger').namespace('linkBankOperations')

const fetchNeighboringOperations = (bill, options) => {
  let date = new Date(bill.paidDate || bill.date)
  let startDate = moment(date).subtract(options.minDateDelta, 'days')
  let endDate = moment(date).add(options.maxDateDelta, 'days')

  // Get the operations corresponding to the date interval around the date of the bill
  let startkey = `${startDate.format('YYYY-MM-DDT00:00:00.000')}Z`
  let endkey = `${endDate.format('YYYY-MM-DDT00:00:00.000')}Z`
  return cozyClient.data.defineIndex(DOCTYPE, ['date']).then(index =>
    cozyClient.data.query(index, {
      selector: {
        date: {
          $gt: startkey,
          $lt: endkey
        }
      }
    })
  )
}

const findMatchingOperation = (bill, operations, options) => {
  let operationToLink = null
  let candidateOperationsForLink = []
  let minAmountDelta = Infinity
  let amount = Math.abs(bill.amount)

  // By default, an bill is an expense. If it is not, it should be
  // declared as a refund: isRefund=true.
  if (bill.isRefund === true) amount *= -1

  for (let operation of operations) {
    let opAmount = Math.abs(operation.amount)

    // By default, an bill is an expense. If it is not, it should be
    // declared as a refund: isRefund=true.
    if (bill.isRefund === true) opAmount *= -1

    let amountDelta = Math.abs(opAmount - amount)

    // Select the operation to link based on the minimal amount
    // difference to the expected one and if the label matches one
    // of the possible labels (identifier)
    for (let identifier of options.identifiers) {
      const hasIdentifier =
        operation.label.toLowerCase().indexOf(identifier) >= 0
      const similarAmount =
        amountDelta <= options.amountDelta && amountDelta <= minAmountDelta
      if (hasIdentifier && similarAmount) {
        operationToLink = operation
        minAmountDelta = amountDelta
        return operationToLink
      }
    }
  }
  return null
}

const addBillToOperation = function(bill, matchingOperation) {
  log('debug', matchingOperation, 'There is an operation to link')

  if (matchingOperation.billIds && matchingOperation.billIds.indexOf(bill._id) > -1) {
    return Promise.resolve()
  }

  const billIds = matchingOperation.billIds || []
  billIds.push(`io.cozy.bills:${bill._id}`)

  return cozyClient.data.updateAttributes(DOCTYPE, matchingOperation._id, {
    billIds
  })
}

const linkBillsToOperations = function(bills, options) {
  return bluebird.each(bills, bill => {
    return fetchNeighboringOperations(bill, options)
      .then(operations => findMatchingOperation(bill, operations, options))
      .then(matchingOperation => {
        if (matchingOperation) {
          return addBillToOperation(bill, matchingOperation)
        }
      })
  })
}

module.exports = (bills, doctype, fields, options = {}) => {
  // Use the custom bank identifier from user if any
  if (fields.bank_identifier && fields.bank_identifier.length) {
    options.identifiers = [fields.bank_identifier]
  }

  if (typeof options.identifiers === 'string') {
    options.identifiers = [options.identifiers.toLowerCase()]
  } else if (Array.isArray(options.identifiers)) {
    options.identifiers = options.identifiers.map(id => id.toLowerCase())
  } else {
    throw new Error(
      'linkBankOperations cannot be called without "identifiers" option'
    )
  }
  log('info', `Bank identifiers: ${options.identifiers}`)

  options.amountDelta = options.amountDelta || 0.001
  options.dateDelta = options.dateDelta || 15
  options.minDateDelta = options.minDateDelta || options.dateDelta
  options.maxDateDelta = options.maxDateDelta || options.dateDelta

  return linkBillsToOperations(bills, options)
}

module.exports.fetchNeighboringOperations = fetchNeighboringOperations
module.exports.findMatchingOperation = findMatchingOperation
module.exports.addBillToOperation = addBillToOperation
module.exports.linkBillsToOperations = linkBillsToOperations
