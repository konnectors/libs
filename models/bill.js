const cozy = require('../cozyclient')
const moment = require('moment')
const DOCTYPE = 'io.cozy.bills'

module.exports = {
  displayName: 'Bill',
  doctype: DOCTYPE,
  all (callback) {
    cozy.data.defineIndex(DOCTYPE, ['date'])
    .then((index) => {
      return cozy.data.query(index, {'selector': {date: {'$gt': 0}}})
    })
    .then(bills => {
      bills = bills.map(bill => {
        bill.date = moment(bill.date)
        return bill
      })
      callback(null, bills)
    })
    .catch(err => {
      callback(err)
    })
  },
  create (entry, callback) {
    cozy.data.create(DOCTYPE, entry)
    .then(() => callback())
    .catch(err => callback(err))
  },
  findBy (selector, callback) {
    if (!selector) selector = {date: {'$gt': 0}}

    cozy.data.defineIndex(DOCTYPE, ['date'])
    .then((index) => {
      return cozy.data.query(index, {'selector': selector})
    })
    .then(bills => {
      bills = bills.map(bill => {
        bill.date = moment(bill.date)
        return bill
      })
      callback(null, bills)
    })
    .catch(err => {
      callback(err)
    })
  }
}
