/**
 * Bank transactions categorization
 *
 * @module categorization
 */

const { tokenizer } = require('./helpers')
const { createModel: createGlobalModel } = require('./globalModel')
const { createModel: createLocalModel } = require('./localModel')
const logger = require('cozy-logger')

const log = logger.namespace('categorization')

/**
 * @typedef CreateCategorizerOptions
 * @property {boolean} useGlobalModel
 * @property {Function} fetchTransactions
 */

/**
 * Initialize global and local models and return an object exposing a
 * `categorize` function that applies both models on an array of transactions
 *
 * The global model is a model specific to hosted Cozy instances. It is not available for self-hosted instances. It will just do nothing in that case.
 *
 * The local model is based on the user manual categorizations.
 *
 * Each model adds two properties to the transactions:
 *   The global model adds `cozyCategoryId` and `cozyCategoryProba`
 *   The local model adds `localCategoryId` and `localCategoryProba`
 *
 * In the end, each transaction can have up to four different categories. An application can use these categories to show the most significant for the user. See https://github.com/cozy/cozy-doctypes/blob/master/docs/io.cozy.bank.md#categories for more informations.
 *
 * @param {CreateCategorizerOptions} options Options used to build the categorizer
 * @returns {object} an object with a `categorize` method
 * @example
 * const { BaseKonnector, createCategorizer } = require('cozy-konnector-libs')
 *
 * class BankingKonnector extends BaseKonnector {
 *   async saveTransactions() {
 *     const transactions = await this.fetchTransactions()
 *     const categorizer = await createCategorizer
 *     const categorizedTransactions = await categorizer.categorize(transactions)
 *
 *     // Save categorizedTransactions
 *   }
 * }
 */
async function createCategorizer({ useGlobalModel = true, fetchTransactions }) {
  const classifierOptions = { tokenizer }

  // We can't initialize the model in parallel using `Promise.all` because with
  // it is not possible to manage errors separately
  let globalModel, localModel

  try {
    globalModel = await createGlobalModel(classifierOptions)
  } catch (e) {
    log('warn', 'Failed to create global model:')
    log('warn', e.message)
  }

  if (useGlobalModel) {
    try {
      localModel = await createLocalModel({
        ...classifierOptions,
        fetchTransactions
      })
    } catch (e) {
      log('warn', 'Failed to create local model:')
      log('warn', e.message)
    }
  }

  const modelsToApply = [globalModel, localModel].filter(Boolean)

  const categorize = transactions => {
    modelsToApply.forEach(model => model.categorize(transactions))

    return transactions
  }

  return { categorize }
}

/**
 * Initialize global and local models and categorize the given array of transactions
 *
 * @see {@link createCategorizer} for more informations about models initialization
 * @param {CreateCategorizerOptions} options Options passed to create the categorizer
 * @returns {object[]} the categorized transactions
 * @example
 * const { BaseKonnector, categorize } = require('cozy-konnector-libs')
 *
 * class BankingKonnector extends BaseKonnector {
 *   async saveTransactions() {
 *     const transactions = await this.fetchTransactions()
 *     const categorizedTransactions = await categorize(transactions)
 *
 *     // Save categorizedTransactions
 *   }
 * }
 */
async function categorize(transactions, options = { useGlobalModel: true }) {
  const categorizer = await createCategorizer(options)

  return categorizer.categorize(transactions)
}

module.exports = {
  createCategorizer,
  categorize
}
