/**
 * ### linkBankOperations ( entries, doctype, fields, options = {} )
 *
 * This function will soon move to a dedicated service. You should not use it.
 * The goal of this function is to find links between bills and bank operations.
 *
 * @module linkBankOperations
 */

const bluebird = require('bluebird')
const log = require('cozy-logger').namespace('linkBankOperations')
const { findDebitOperation, findCreditOperation } = require('./linker/billsToOperation')
const fs = require('fs')

const DOCTYPE_OPERATIONS = 'io.cozy.bank.operations'
const DEFAULT_AMOUNT_DELTA = 0.001
const DEFAULT_PAST_WINDOW = 15
const DEFAULT_FUTURE_WINDOW = 29

class Linker {
  constructor (cozyClient) {
    this.cozyClient = cozyClient
  }

  addBillToOperation (bill, operation) {
    if (!bill._id) {
      log('warn', 'bill has no id, impossible to add it to an operation')
      return Promise.resolve()
    }
    const billId = `io.cozy.bills:${bill._id}`
    if (operation.bills && operation.bills.indexOf(billId) > -1) {
      return Promise.resolve()
    }

    const billIds = operation.bills || []
    billIds.push(billId)
    const attributes = { bills: billIds }

    return this.cozyClient.data.updateAttributes(
      DOCTYPE_OPERATIONS,
      operation._id,
      attributes
    )
  }

  addReimbursementToOperation (bill, debitOperation, matchingOperation) {
    if (!bill._id) {
      log('warn', 'bill has no id, impossible to add it as a reimbursement')
      return Promise.resolve()
    }
    const billId = `io.cozy.bills:${bill._id}`
    if (
      debitOperation.reimbursements &&
      debitOperation.reimbursements.map(b => b.billId).indexOf(billId) > -1
    ) {
      return Promise.resolve()
    }

    const reimbursements = debitOperation.reimbursements || []

    reimbursements.push({
      billId,
      amount: bill.amount,
      operationId: matchingOperation && matchingOperation._id
    })

    return this.cozyClient.data.updateAttributes(
      DOCTYPE_OPERATIONS,
      debitOperation._id,
      { reimbursements: reimbursements }
    )
  }

  /**
   * Link bills to
   *   - their matching banking operation (debit)
   *   - to their reimbursement (credit)
   */
  linkBillsToOperations (bills, options) {
    const result = {}

    // when bill comes from a third party payer,
    // no transaction is visible on the bank account
    bills = bills.filter(bill => !bill.isThirdPartyPayer === true)

    return bluebird.each(bills, bill => {
      const res = result[bill._id] = { bill:bill }

      const linkBillToDebitOperation = () => {
        return findDebitOperation(this.cozyClient, bill, options)
          .then(operation => {
            if (operation) {
              res.debitOperation = operation
              log('debug', bill, 'Matching bill')
              log('debug', operation, 'Matching debit operation')
              return this.addBillToOperation(bill, operation).then(() => operation)
            }
          })
      }

      const linkBillToCreditOperation = debitOperation => {
        return findCreditOperation(this.cozyClient, bill, options)
          .then(creditOperation => {
            const promises = []
            if (creditOperation) {
              res.creditOperation = creditOperation
              promises.push(this.addBillToOperation(bill, creditOperation))
            }
            if (creditOperation && debitOperation) {
              log('debug', bill, 'Matching bill')
              log('debug', creditOperation, 'Matching credit creditOperation')
              promises.push(this.addReimbursementToOperation(bill, debitOperation, creditOperation))
            }
            return Promise.all(promises)
          })
      }

      return linkBillToDebitOperation().then(debitOperation => {
        if (bill.isRefund) {
          return linkBillToCreditOperation(debitOperation)
        }
      })
    })
    .then(() => {
      return result
    })
  }
}

const jsonTee = filename => res => {
  fs.writeFileSync(filename, JSON.stringify(res, null, 2))
  return res
}

module.exports = (bills, doctype, fields, options = {}) => {
  // Use the custom bank identifier from user if any
  if (fields.bank_identifier && fields.bank_identifier.length) {
    options.identifiers = [fields.bank_identifier]
  }

  if (typeof options.identifiers === 'string') {
    options.identifiers = [options.identifiers.toLowerCase()]
  } else if (Array.isArray(options.identifiers)) {
    options.identifiers = options.identifiers.map(id => id.toLowerCase())
  } else {
    throw new Error(
      'linkBankOperations cannot be called without "identifiers" option'
    )
  }

  options.amountDelta = options.amountDelta || DEFAULT_AMOUNT_DELTA
  options.minAmountDelta = options.minAmountDelta || options.amountDelta
  options.maxAmountDelta = options.maxAmountDelta || options.amountDelta

  options.pastWindow = options.pastWindow || DEFAULT_PAST_WINDOW
  options.futureWindow = options.futureWindow || DEFAULT_FUTURE_WINDOW

  const cozyClient = require('./cozyclient')
  const linker = new Linker(cozyClient)
  const prom = linker.linkBillsToOperations(bills, options)
  if (process.env.LINK_RESULTS_FILENAME) {
    prom.then(jsonTee(process.env.LINK_RESULTS_FILENAME))
  }
  return prom
}

Object.assign(module.exports, {
  Linker
})
