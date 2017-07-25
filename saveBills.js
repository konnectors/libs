const Bill = require('./models/bill')
const filterExisting = require('./filter_existing')
const saveDataAndFile = require('./save_data_and_file')
const linkBankOperations = require('./linkBankOperations')

module.exports = (fileOptions, bankOptions) => {
  return function (requiredFields, entries, body, next) {
    filterExisting(null, Bill)(requiredFields, entries, body, function (err) {
      if (err) return next(err)

      saveDataAndFile(null, Bill, fileOptions)(requiredFields, entries, body, function (err) {
        if (err) return next(err)

        // compatibility code
        const bills = entries.filtered.map(bill => {
          // change moment instance to date instance
          if (bill.date && bill.date.toDate) bill.date = bill.date.toDate()
          return bill
        })

        linkBankOperations(bills, 'io.cozy.bills')
        .then(() => next())
        .catch(err => next(err))
      })
    })
  }
}
