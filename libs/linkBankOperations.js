/**
 * ### linkBankOperations ( entries, doctype, fields, options = {} )
 *
 * This function will soon move to a dedicated service. You should not use it.
 * The goal of this function is to find links between bills and bank operations.
 *
 * @module linkBankOperations
 */

const moment = require('moment')
const bluebird = require('bluebird')
const { findMatchingOperation } = require('./linker/billsToOperation')
const log = require('./logger').namespace('linkBankOperations')

const DOCTYPE = 'io.cozy.bank.operations'
const DEFAULT_AMOUNT_DELTA = 0.001
const DEFAULT_DATE_DELTA = 15

const reimbursedTypes = ['health_costs']

const coerceToDate = function (d) {
  if (!d) {
    return d
  } else if (typeof d === 'string') {
    return new Date(d)
  } else if (d.toDate) {
    return d.toDate()
  } else if (d.getYear) { return d } else {
    throw new Error('Invalid date')
  }
}
const equalDates = function (d1, d2) {
  d1 = coerceToDate(d1)
  d2 = coerceToDate(d2)
  try {
    return d1 && d2 &&
    d1.getYear() === d2.getYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  } catch (e) {
    return false
  }
}

const getTotalReimbursements = operation => {
  if (!operation.reimbursements) { return 0 }
  return operation.reimbursements.reduce((s, r) => s + r.amount, 0)
}

// DOES NOT NEED COZY CLIENT
const findReimbursedOperation = (bill, operations, options) => {
  if (!bill.isRefund) { return null }

  // By default, an bill is an expense. If it is not, it should be
  // declared as a refund: isRefund=true.
  let billAmount = Math.abs(bill.originalAmount)

  const canBeReimbursed = reimbursedTypes.indexOf(bill.type) > -1
  if (!canBeReimbursed) {
    return null
  }

  for (let operation of operations) {
    const opAmount = operation.amount
    const sameAmount = -billAmount === opAmount
    const sameDate = equalDates(bill.originalDate, operation.date)
    const totalReimbursements = getTotalReimbursements(operation)
    const fitIntoReimbursements = totalReimbursements + -billAmount <= -opAmount
    if (sameAmount && sameDate && fitIntoReimbursements) {
      return operation
    }
  }
  return null
}

class Linker {
  constructor (cozyClient) {
    this.cozyClient = cozyClient
  }

  fetchNeighboringOperations (bill, options) {
    const createDateSelector = () => {
      const date = new Date(bill.originalDate || bill.date)
      const startDate = moment(date).subtract(options.minDateDelta, 'days')
      const endDate = moment(date).add(options.maxDateDelta, 'days')

      // Get the operations corresponding to the date interval around the date of the bill
      return {
        $gt: `${startDate.format('YYYY-MM-DDT00:00:00.000')}Z`,
        $lt: `${endDate.format('YYYY-MM-DDT00:00:00.000')}Z`
      }
    }

    const createAmountSelector = () => {
      const amount = bill.isRefund ? bill.amount : -bill.amount
      const min = amount - options.minAmountDelta
      const max = amount + options.maxAmountDelta

      return {
        $gt: min,
        $lt: max
      }
    }

    let operations = []
    // cozy-stack limit to 100 elements
    const limit = 100

    const getOptions = ids => {
      const options = {
        selector: {
          date: createDateSelector(),
          amount: createAmountSelector()
        },
        sort: [{date: 'desc'}, {amount: 'desc'}],
        limit
      }

      if (ids.length > 0) {
        options.skip = ids.length
      }

      return options
    }

    const fetchAll = (index, ids = []) => {
      return this.cozyClient.data.query(index, getOptions(ids)).then(ops => {
        operations = operations.concat(ops)
        if (ops.length === limit) {
          const newIds = ops.map(op => op._id)
          return fetchAll(index, ids.concat(newIds))
        } else {
          return operations
        }
      })
    }

    return this.cozyClient.data.defineIndex(DOCTYPE, ['date', 'amount']).then(index => {
      return fetchAll(index)
    })
  }

  addBillToOperation (bill, operation) {
    if (!bill._id) {
      log('warn', 'bill has no id, impossible to add it to an operation')
      return Promise.resolve()
    }
    const billId = `io.cozy.bills:${bill._id}`
    if (operation.bills && operation.bills.indexOf(billId) > -1) {
      return Promise.resolve()
    }

    const billIds = operation.bills || []
    billIds.push(billId)

    return this.cozyClient.data.updateAttributes(DOCTYPE, operation._id, {
      bills: billIds
    })
  }

  addReimbursementToOperation (bill, operation, matchingOperation) {
    if (!bill._id) {
      log('warn', 'bill has no id, impossible to add it as a reimbursement')
      return Promise.resolve()
    }
    if (operation.reimbursements && operation.reimbursements.map(b => b._id).indexOf(bill._id) > -1) {
      return Promise.resolve()
    }

    const reimbursements = operation.reimbursements || []

    reimbursements.push({
      billId: `io.cozy.bills:${bill._id}`,
      amount: bill.amount,
      operationId: matchingOperation && matchingOperation._id
    })

    return this.cozyClient.data.updateAttributes(DOCTYPE, operation._id, {
      reimbursements: reimbursements
    })
  }

  linkMatchingOperation (bill, operations, options) {
    const matchingOp = findMatchingOperation(bill, operations, options)
    if (matchingOp) {
      log('debug', bill, 'Matching bill')
      log('debug', matchingOp, 'Matching operation')
      return this.addBillToOperation(bill, matchingOp).then(() => matchingOp)
    }
  }

  linkReimbursedOperation (bill, operations, options, matchingOp) {
    const reimbursedOp = findReimbursedOperation(bill, operations, options)
    if (!reimbursedOp) { return Promise.resolve() }
    return this.addReimbursementToOperation(bill, reimbursedOp, matchingOp)
      .then(() => reimbursedOp)
  }

  /**
   * Link bills to
   *   - their matching banking operation (debit)
   *   - to their reimbursement (credit)
   */
  linkBillsToOperations (bills, options) {
    const result = {}

    bills = bills.filter(bill => !bill.isThirdPartyPayer === true)

    return bluebird.each(bills, bill => {
      const res = result[bill._id] = {matching: [], reimbursed: []}
      // Get all operations whose date is close to out bill
      let operations
      return this.fetchNeighboringOperations(bill, options)
        .then(ops => {
          operations = ops
          return this.linkMatchingOperation(bill, operations, options)
        }).then(matchingOp => {
          if (matchingOp) { res.matching.push(matchingOp) }
          return this.linkReimbursedOperation(bill, operations, options, matchingOp)
            .then(reimbursedOp => {
              if (reimbursedOp) { res.reimbursed.push(reimbursedOp) }
            })
        })
    }).then(() => {
      return result
    })
  }
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

  options.amountDelta = options.amountDelta || DEFAULT_AMOUNT_DELTA
  options.minAmountDelta = options.minAmountDelta || options.amountDelta
  options.maxAmountDelta = options.maxAmountDelta || options.amountDelta

  options.dateDelta = options.dateDelta || DEFAULT_DATE_DELTA
  options.minDateDelta = options.minDateDelta || options.dateDelta
  options.maxDateDelta = options.maxDateDelta || options.dateDelta

  const cozyClient = require('./cozyclient')
  const linker = new Linker(cozyClient)
  return linker.linkBillsToOperations(bills, options)
}

Object.assign(module.exports, {
  findMatchingOperation,
  findReimbursedOperation,
  Linker
})
