const moment = require('moment')
const bluebird = require('bluebird')
const cozyClient = require('./cozyclient')
const DOCTYPE = 'io.cozy.bank.operations'
const log = require('./logger')

module.exports = (entries, doctype, options = {}) => {
  if (typeof options.identifiers === 'string') {
    options.identifiers = [options.identifiers.toLowerCase()]
  } else if (Array.isArray(options.identifiers)) {
    options.identifiers = options.identifiers.map((id) => (id.toLowerCase()))
  } else {
    throw new Error('linkBankOperations cannot be called without "identifiers" option')
  }

  Object.assign(options, {
    amountDelta: 0.001,
    dateDelta: 15
  })

  options.minDateDelta = options.minDateDelta || options.dateDelta
  options.maxDateDelta = options.maxDateDelta || options.dateDelta

  // for each entry try to get a corresponding operation
  return bluebird.each(entries, entry => {
    let date = new Date(entry.paidDate || entry.date)
    let startDate = moment(date).subtract(options.minDateDelta, 'days')
    let endDate = moment(date).add(options.maxDateDelta, 'days')

    // get the list of operation corresponding to the date interval arount the date of the entry
    let startkey = `${startDate.format('YYYY-MM-DDT00:00:00.000')}Z`
    let endkey = `${endDate.format('YYYY-MM-DDT00:00:00.000')}Z`
    return cozyClient.data.defineIndex(DOCTYPE, ['date'])
    .then(index => cozyClient.data.query(index, { selector: {
      date: {
        '$gt': startkey,
        '$lt': endkey
      }}
    }))
    .then(operations => {
      // find the operations with the expected identifier
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
        for (let identifier of options.identifiers) {
          if (operation.label.toLowerCase().indexOf(identifier) >= 0 &&
            amountDelta <= options.amountDelta &&
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
        log('debug', operationToLink, 'There is an operation to link')
        let link = `${doctype}:${entry._id}`
        if (operationToLink.bill === link) return Promise.resolve()
        return cozyClient.data.updateAttributes(DOCTYPE, operationToLink._id, { bill: link })
      }
      return Promise.resolve()
    })
  })
}
