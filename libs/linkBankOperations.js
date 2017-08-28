const moment = require('moment')
const bluebird = require('bluebird')
const DOCTYPE = 'io.cozy.bank.operations'

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
const findMatchingOperation = (bill, operations, options) => {
  const identifiers = options.identifiers || []
  let amount = Math.abs(bill.amount)

  // By default, a bill is an expense. If it is not, it should be
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
    for (let identifier of identifiers) {
      const hasIdentifier =
        operation.label.toLowerCase().indexOf(identifier) >= 0
      const similarAmount = amountDelta <= options.amountDelta
      if (hasIdentifier && similarAmount) {
        return operation
      }
    }
  }
  return null
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
  constructor (cozy) {
    this.cozy = cozy
  }

  fetchNeighboringOperations (bill, options) {
    if (typeof options.minDateDelta === 'undefined' || typeof options.maxDateDelta === 'undefined') {
      return Promise.reject(new Error('Must have options.{min,max}DateDelta'))
    }
    let date = new Date(bill.originalDate || bill.date)
    let startDate = moment(date).subtract(options.minDateDelta, 'days')
    let endDate = moment(date).add(options.maxDateDelta, 'days')

    // Get the operations corresponding to the date interval around the date of the bill
    let startkey = `${startDate.format('YYYY-MM-DDT00:00:00.000')}Z`
    let endkey = `${endDate.format('YYYY-MM-DDT00:00:00.000')}Z`
    return this.cozy.data.defineIndex(DOCTYPE, ['date']).then(index =>
      this.cozy.data.query(index, {
        selector: {
          date: {
            $gt: startkey,
            $lt: endkey
          }
        }
      })
    )
  }

  addBillToOperation (bill, operation) {
    if (operation.bills && operation.bills.indexOf(bill._id) > -1) {
      return Promise.resolve()
    }

    const billIds = operation.billIds || []
    billIds.push(`io.cozy.bills:${bill._id}`)

    return this.cozy.data.updateAttributes(DOCTYPE, operation._id, {
      bills: billIds
    })
  }

  addReimbursementToOperation (bill, operation, matchingOperation, cozy) {
    if (operation.reimbursements && operation.reimbursements.map(b => b._id).indexOf(bill._id) > -1) {
      return Promise.resolve()
    }

    const reimbursements = operation.reimbursements || []
    reimbursements.push({
      billId: `io.cozy.bills:${bill._id}`,
      amount: bill.amount,
      operationId: matchingOperation && matchingOperation._id
    })

    return this.cozy.data.updateAttributes(DOCTYPE, operation._id, {
      reimbursements: reimbursements
    })
  }

  linkMatchingOperation (bill, operations, options) {
    const matchingOp = findMatchingOperation(bill, operations, options)
    if (matchingOp) {
      if (!matchingOp) { return }
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

  options.amountDelta = options.amountDelta || 0.001
  options.dateDelta = options.dateDelta || 15
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
