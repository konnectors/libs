/**
 * Bank transactions categorization
 * @module categorization
 */

const { tokenizer } = require('./helpers')
const { globalModel } = require('./globalModel')
const { localModel } = require('./localModel')

/**
 * Apply both global and local categorization models to an array of transactions.
 *
 * The global model is a model specific to hosted Cozy instances. It is not available for self-hosted instances. It will just do nothing in that case.
 *
 * The local model is based on the user manual categorizations.
 *
 * Each model adds two properties to the transactions:
 *   * The global model adds `cozyCategoryId` and `cozyCategoryProba`
 *   * The local model adds `localCategoryId` and `localCategoryProba`
 *
 * In the end, each transaction can have up to four different categories. An application can use these categories to show the most significant for the user. See https://github.com/cozy/cozy-doctypes/blob/master/docs/io.cozy.bank.md#categories for more informations.
 *
 * @param {Object[]} transactions The transactions to categorize
 * @return {Object[]} The categorized transactions
 *
 * @example
 * const { BaseKonnector, categorize } = require('cozy-konnector-libs')
 *
 * class BankingKonnector extends BaseKonnector {
 *   saveTransactions() {
 *     const transactions = await this.fetchTransactions()
 *     const categorizedTransactions = await categorize(transactions)
 *
 *     // Save categorizedTransactions
 *   }
 * }
 */
async function categorize(transactions) {
  const classifierOptions = { tokenizer }

  await Promise.all([
    globalModel(classifierOptions, transactions),
    localModel(classifierOptions, transactions)
  ])

  return transactions
}

module.exports = categorize
