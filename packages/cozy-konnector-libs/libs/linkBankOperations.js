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
const { fetchAll } = require('./utils')
const defaults = require('lodash/defaults')

const DOCTYPE_OPERATIONS = 'io.cozy.bank.operations'
const DEFAULT_AMOUNT_DELTA = 0.001
const DEFAULT_PAST_WINDOW = 15
const DEFAULT_FUTURE_WINDOW = 29

class Linker {
  constructor (cozyClient) {
    this.cozyClient = cozyClient
    this.toUpdate = []
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

    return this.updateAttributes(
      DOCTYPE_OPERATIONS,
      operation,
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

    return this.updateAttributes(
      DOCTYPE_OPERATIONS,
      debitOperation,
      { reimbursements: reimbursements }
    )
  }

  /* Buffer update operations */
  updateAttributes (doc, attrs) {
    Object.assign(doc, attrs)
    this.toUpdate.push(doc)
    return Promise.resolve()
  }

  commitChanges () {
    return cozyClient.fetchJSON(
      'POST',
      `data/${DOCTYPE_OPERATIONS}/_bulk_docs`,
      {
        data: JSON.stringify
      }
    )
  }

  getOptions (opts={}) {
    const options = {...opts}

    if (typeof options.identifiers === 'string') {
      options.identifiers = [options.identifiers.toLowerCase()]
    } else if (Array.isArray(options.identifiers)) {
      options.identifiers = options.identifiers.map(id => id.toLowerCase())
    } else {
      throw new Error(
        'linkBankOperations cannot be called without "identifiers" option'
      )
    }

    defaults(options, { amountDelta: DEFAULT_AMOUNT_DELTA })
    defaults(options, {
      minAmountDelta: options.amountDelta,
      maxAmountDelta: options.amountDelta,
      pastWindow: DEFAULT_PAST_WINDOW,
      futureWindow: DEFAULT_FUTURE_WINDOW
    })

    return options
  }

  /**
   * Link bills to
   *   - their matching banking operation (debit)
   *   - to their reimbursement (credit)
   */
  async linkBillsToOperations (bills, options) {
    options = this.getOptions(options)
    const result = {}

    const allOperations = await fetchAll('io.cozy.bank.operations')

    // when bill comes from a third party payer,
    // no transaction is visible on the bank account
    bills = bills.filter(bill => !bill.isThirdPartyPayer === true)

    return bluebird.each(bills, bill => {
      const res = result[bill._id] = { bill:bill }

      const linkBillToDebitOperation = () => {
        return findDebitOperation(this.cozyClient, bill, options, allOperations)
          .then(operation => {
            if (operation) {
              console.log('found debit operation', operation)
              res.debitOperation = operation
              log('debug', bill, 'Matching bill')
              log('debug', operation, 'Matching debit operation')
              return this.addBillToOperation(bill, operation).then(() => operation)
            }
          })
      }

      const linkBillToCreditOperation = debitOperation => {
        return findCreditOperation(this.cozyClient, bill, options, allOperations)
          .then(creditOperation => {
            const promises = []
            if (creditOperation) {
              console.log('found credit operation')
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
  if (fields.bank_identifier && fields.bank_identifier.length) {
    options.identifiers = [fields.bank_identifier]
  }
  // Use the custom bank identifier from user if any
  const cozyClient = require('./cozyclient')
  const linker = new Linker(cozyClient)
  const prom = linker.linkBillsToOperations(bills, options)
    .catch(err => {
      console.log(err)
    })
  if (process.env.LINK_RESULTS_FILENAME) {
    prom.then(jsonTee(process.env.LINK_RESULTS_FILENAME))
  }
  return prom
}

Object.assign(module.exports, {
  Linker
})
