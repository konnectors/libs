const async = require('async')
const moment = require('moment')

const BankOperation = require('./models/bankoperation')

// Object that will handle all the matching and linking operation depending a
// given model.
// For each given bills, it will compare if a bank operation looks to match it.
// If the amount and date matched, the bill binary is linked to the bank
// operation.
class BankOperationLinker {
  constructor (options) {
    this.log = options.log
    this.model = options.model
    if (typeof options.identifier === 'string') {
      this.identifier = [options.identifier.toLowerCase()]
    } else {
      this.identifier = options.identifier.map((id) => (id.toLowerCase()))
    }

    this.amountDelta = options.amountDelta || 0.001
    this.dateDelta = options.dateDelta || 15
    this.minDateDelta = options.minDateDelta || this.dateDelta
    this.maxDateDelta = options.maxDateDelta || this.dateDelta
  }
  link (entries, callback) {
    async.eachSeries(entries, this.linkOperationIfExist.bind(this), callback)
  }
//  For a given entry we look for an operation with same date and same
//  amount.
  linkOperationIfExist (entry, callback) {
    let date = new Date(entry.paidDate || entry.date)
    let startDate = moment(date).subtract(this.minDateDelta, 'days')
    let endDate = moment(date).add(this.maxDateDelta, 'days')

    let startkey = `${startDate.format('YYYY-MM-DDT00:00:00.000')}Z`
    let endkey = `${endDate.format('YYYY-MM-DDT00:00:00.000')}Z`

    BankOperation.all({
      date: {
        '$gt': startkey,
        '$lt': endkey
      }
    }, (err, operations) => {
      if (err) return callback(err)
      this.linkRightOperation(operations, entry, callback)
    })
  }
  // Look for the operation of which amount matches the entry amount
  // If an operation to link is found, we save the binary ID
  // and the file ID as an extra attribute of the operation.
  linkRightOperation (operations, entry, callback) {
    let operationToLink = null

    let amount = Math.abs(parseFloat(entry.amount))
    // By default, an entry is an expense. If it is not, it should be
    // declared as a refund: isRefund=true.
    if (entry.isRefund === true) amount *= -1

    let minAmountDelta = Infinity
    for (let operation of operations) {
      let opAmount = Math.abs(operation.amount)

      // By default, an entry is an expense. If it is not, it should be
      // declared as a refund: isRefund=true.
      if (entry.isRefund === true) opAmount *= -1

      let amountDelta = Math.abs(opAmount - amount)

      // Select the operation to link based on the minimal amount
      // difference to the expected one and if the label matches one
      // of the possible labels (identifier)
      for (let identifier in this.identifier) {
        if (operation.title.toLowerCase().indexOf(identifier) >= 0 &&
          amountDelta <= this.amountDelta &&
          amountDelta <= minAmountDelta) {
          operationToLink = operation
          minAmountDelta = amountDelta
          break
        }
      }
    }

    if (operationToLink === null) {
      callback()
    } else {
      this.linkOperation(operationToLink, entry, callback)
    }
  }
  // Save the binary ID and the file ID as an extra attribute of the
  // operation.
  linkOperation (operation, entry, callback) {
    let date = new Date(entry.date)
    let key = `${moment(date).format('YYYY-MM-DD')}T00:00:00.000Z`

    this.model.request('byDate', {key: key}, (err, entries) => {
      // We ignore error, no need to make fail the import for that.
      // We just log it.
      if (err) {
        this.log.raw(err)
        callback()
      } else if (entries.length === 0) {
        callback()
      } else {
        let entry = entries[0]

        operation.setBinaryFromFile(operation._id, entry.fileId, (err, operation) => {
          if (err) this.log.raw(err)
          else { this.log.debug(`Binary ${operation.binary.file.id} linked with operation: ${operation.title} - ${operation.amount}`) }
          callback()
        })
      }
    })
  }
}

// Procedure that link fetched bills to bank operation contained inside the
// Cozy.
module.exports = (options) => {
  return (requiredFields, entries, data, next) => {
    let linker = new BankOperationLinker(options)
    linker.link(entries.fetched, next)
  }
}
