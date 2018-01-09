var { operationsFilters, order } = require('./operationsFilters')

export const findMatchingOperation = (bill, operations, options) => {
  operations = operationsFilters(bill, operations, options)
  operations = order(bill, operations)

  return operations[0]
}
