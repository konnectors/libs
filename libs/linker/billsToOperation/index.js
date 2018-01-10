var { operationsFilters, order } = require('./operationsFilters')

const findMatchingOperation = (bill, operations, options) => {
  operations = operationsFilters(bill, operations, options)
  operations = order(bill, operations)

  return operations[0]
}

module.exports = {findMatchingOperation}
