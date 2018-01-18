const format = require('date-fns/format')
const { getDateRangeFromBill, getAmountRangeFromBill } = require('./helpers')

// cozy-stack limit to 100 elements max
const COZY_STACK_QUERY_LIMIT = 100
const DOCTYPE_OPERATIONS = 'io.cozy.bank.operations'

// Get the operations corresponding to the date interval
// around the date of the bill
const createDateSelector = (bill, options) => {
  const { minDate, maxDate } = getDateRangeFromBill(bill, options)
  const dateFormat = 'YYYY-MM-DDT00:00:00.000 [Z]'

  return {
    $gt: format(minDate, dateFormat),
    $lt: format(maxDate, dateFormat)
  }
}

// Get the operations corresponding to the date interval
// around the amount of the bill
const createAmountSelector = (bill, options) => {
  const {minAmount, maxAmount} = getAmountRangeFromBill(bill, options)

  return {
    $gt: minAmount,
    $lt: maxAmount
  }
}

const getQueryOptions = (bill, options, ids) => {
  const queryOptions = {
    selector: {
      date: createDateSelector(bill, options),
      amount: createAmountSelector(bill, options)
    },
    sort: [{date: 'desc'}, {amount: 'desc'}],
    COZY_STACK_QUERY_LIMIT
  }

  if (ids.length > 0) {
    queryOptions.skip = ids.length
  }

  return queryOptions
}

const fetchNeighboringOperations = (cozyClient, bill, options) => {
  let operations = []

  const fetchAll = (index, ids = []) => {
    const queryOptions = getQueryOptions(bill, options, ids)
    return cozyClient.data.query(index, queryOptions)
      .then(ops => {
        operations = operations.concat(ops)
        if (ops.length === COZY_STACK_QUERY_LIMIT) {
          const newIds = ops.map(op => op._id)
          return fetchAll(index, ids.concat(ops))
        } else {
          return operations
        }
      })
  }

  return cozyClient.data.defineIndex(DOCTYPE_OPERATIONS, ['date', 'amount'])
    .then(index => fetchAll(index))
}

module.exports = {fetchNeighboringOperations}
