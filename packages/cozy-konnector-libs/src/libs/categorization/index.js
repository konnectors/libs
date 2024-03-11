/**
 * Bank transactions categorization
 *
 * @module categorization
 */

const logger = require('cozy-logger')

const { createModel: createGlobalModel } = require('./globalModel')
const { tokenizer } = require('./helpers')
const { createModel: createLocalModel } = require('./localModel')

const log = logger.namespace('categorization')

/**
 * @typedef CreateCategorizerOptions
 * @property {boolean} useGlobalModel Whether to use the globally trained model
 * @property {Function} customTransactionFetcher A custom training transaction fetcher
 * @property {object} pretrainedClassifier A pretrained instance of a bayes classifier
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
 * @returns {{categorize: Function, classifiers: object[]}} A method to categorize transactions and the classifiers it uses.
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
async function createCategorizer(options = {}) {
  const {
    useGlobalModel = true,
    customTransactionFetcher,
    pretrainedClassifier
  } = options
  const classifierOptions = { tokenizer, pretrainedClassifier }

  // We can't initialize the model in parallel using `Promise.all` because with
  // it is not possible to manage errors separately
  let globalModel, localModel

  if (useGlobalModel) {
    try {
      globalModel = await createGlobalModel(classifierOptions)
    } catch (e) {
      log('warn', 'Failed to create global model:')
      log('warn', e.message)
    }
  }

  try {
    localModel = await createLocalModel({
      ...classifierOptions,
      pretrainedClassifier,
      customTransactionFetcher
    })
  } catch (e) {
    log('warn', 'Failed to create local model:')
    log('warn', e.message)
  }

  const modelsToApply = [globalModel, localModel].filter(Boolean)

  const categorize = transactions => {
    modelsToApply.forEach(model => model.categorize(transactions))

    return transactions
  }

  return { categorize, classifiers: modelsToApply.map(e => e.classifier) }
}

/**
 * Initialize global and local models and categorize the given array of transactions
 *
 * @see {@link createCategorizer} for more informations about models initialization
 * @param {object[]} transactions The transactions to categorize
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
