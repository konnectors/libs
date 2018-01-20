const { operationsFilters } = require('./operationsFilters')
const { fetchNeighboringOperations } = require('./fetchNeighboringOperations')
const { sortedOperations } = require('./helpers')

const findOperation = (cozyClient, bill, options) => {
  // By default, a bill is an expense. If it is not, it should be
  // declared as a refund: isRefund=true.
  if (options.credit && !bill.isRefund) return

  return fetchNeighboringOperations(cozyClient, bill, options)
  .then(operations => {
    operations = operationsFilters(bill, operations, options)
    operations = sortedOperations(bill, operations)

    return operations[0]
  })
}

const findDebitOperation = findOperation
const findCreditOperation = (cozyClient, bill, options) => {
  const creditOptions = Object.assign({}, options, {credit: true})
  return findOperation(cozyClient, bill, creditOptions)
}

module.exports = {
  findDebitOperation,
  findCreditOperation
}
