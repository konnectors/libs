const moment = require('moment')

const getBillDate = bill => new Date(bill.originalDate || bill.date)
const getBillAmount = bill => bill.isRefund ? bill.amount : -bill.amount

const getIdentifiers = options => options.identifiers

const getDateRange = (bill, options) => {
  const date = getBillDate(bill)
  return {
    minDate: new Date(moment(date).subtract(options.minDateDelta || 0, 'days')),
    maxDate: new Date(moment(date).add(options.minDateDelta || 0, 'days'))
  }
}

const getAmountRange = (bill, options) => {
  const amount = getBillAmount(bill)
  return {
    minAmount: amount - options.minAmountDelta,
    maxAmount: amount + options.minAmountDelta
  }
}

module.exports = {getBillDate, getBillAmount, getIdentifiers, getDateRange, getAmountRange}
