const async = require('async')
const moment = require('moment')

const BankOperation = require('./models/bankoperation')
const Bill = require('./models/bill')

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
    this.allowUnsafeLinks = options.allowUnsafeLinks || false
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
    let candidateOperationsForLink = []

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
      // If unsafe matching is enabled, also find all operations for which the entry could ba a part of
      for (let identifier of this.identifier) {
        if (operation.label.toLowerCase().indexOf(identifier) >= 0 &&
          amountDelta <= this.amountDelta &&
          amountDelta <= minAmountDelta) {
          operationToLink = operation
          minAmountDelta = amountDelta
          break
        } else if (operation.label.toLowerCase().indexOf(identifier) >= 0 &&  // label must match
                 !operation.parent &&                                       // not a child operation itself
                 amountDelta > 0 &&                                         // op amount is smaller than entry amount
                 ((entry.isRefund && operation.amount > 0) ||               // if entry is refund, op is refund
                 (!entry.isRefund && operation.amount < 0)) &&              // if entry is expense, op is expense
                 this.allowUnsafeLinks) {
          candidateOperationsForLink.push(operation)
        }
      }
    }

    if (operationToLink !== null) {
      this.linkOperation(operationToLink, entry, callback)
    } else if (candidateOperationsForLink.length > 0) {
      // there may be several operations that fit this entry, but right now we don't have enough data to choose one. So we use the first one arbitrarily
      let operation = candidateOperationsForLink[0]

      this.linkChildOperations(operation, entry, callback)
    } else {
      callback()
    }
  }
  getEntryId (entry, callback) {
    let date = `${moment(new Date(entry.date)).format('YYYY-MM-DD')}T00:00:00.000Z`

    Bill.findBy({date: date, amount: entry.amount}, (err, entries) => {
      if (err) {
        callback(err)
      } else if (entries.length === 0) {
        callback(new Error('No matching entry found'))
      } else {
        callback(null, entries[0]._id)
      }
    })
  }
  linkOperation (operation, entry, callback) {
    this.getEntryId(entry, (err, entryId) => {
      if (err) {
        // We ignore error, no need to make fail the import for that.
        // We just log it.
        this.log.error(err)
        callback()
      } else {
        let link = Bill.doctype + ':' + entryId

        // if the operation and the entry are already linked, we can skip this step
        if (operation.bill === link) return callback()

        BankOperation.attachBill(operation._id, link, (err, operation) => {
          if (err) this.log.error(err)
          else {
            this.log.info(`Binary ${operation.bill} linked with operation: ${operation.label} - ${operation.amount}`)
          }
          callback()
        })
      }
    })
  }
  linkChildOperations (parentOperation, entry, callback) {
    this.getEntryId(entry, (err, entryId) => {
      if (err) {
        // We ignore error, no need to make fail the import for that.
        // We just log it.
        this.log.error(err)
        callback()
      } else {
        let link = Bill.doctype + ':' + entryId

        // Since the entry is only a subset of the operation, we create a child operation
        BankOperation.createChildOperation(parentOperation, {
          amount: entry.amount,
          bill: link,
          label: parentOperation.label + ' - ' + entry.subtype
        }, callback)
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
