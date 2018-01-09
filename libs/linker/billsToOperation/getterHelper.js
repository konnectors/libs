const moment = require('moment')

export const getBillDate = bill => new Date(bill.originalDate || bill.date)
export const getBillAmount = bill => bill.isRefund ? bill.amount : -bill.amount

export const getIdentifiers = options => options.identifiers

export const getDateRange = (bill, options) => {
  const date = getBillDate(bill)
  return {
    minDate: new Date(moment(date).subtract(options.minDateDelta || 0, 'days')),
    maxDate: new Date(moment(date).add(options.minDateDelta || 0, 'days'))
  }
}


export const getAmountRange = (bill, options) => {
  const amount = getBillAmount(bill)
  return {
    minAmount: amount - options.minAmountDelta,
    maxAmount: amount + options.minAmountDelta
  }
}
