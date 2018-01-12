var { operationsFilters, order } = require('./operationsFilters')

const findMatchingOperation = (bill, operations, options) => {
  operations = operationsFilters(bill, operations, options)
  operations = order(bill, operations)

  return operations[0]
}

const coerceToDate = d => {
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
const equalDates = (d1, d2) => {
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

const findReimbursedOperation = (bill, operations, options) => {
  const reimbursedTypes = ['health_costs']
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

module.exports = {
  findMatchingOperation,
  findReimbursedOperation
}
