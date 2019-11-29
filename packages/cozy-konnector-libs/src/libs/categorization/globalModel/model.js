const { fetchParameters } = require('./parameters')
const { createClassifier } = require('./classifier')
const { getLabelWithTags } = require('../helpers')
const maxBy = require('lodash/maxBy')
const logger = require('cozy-logger')

const log = logger.namespace('categorization/globalModel')

async function createModel(options) {
  log('debug', 'Fetching parameters from the stack')
  const parameters = await fetchParameters()
  log('debug', 'Successfully fetched parameters from the stack')

  log('debug', 'Instanciating a new classifier')
  const classifier = createClassifier(parameters, options)

  const categorize = transactions => {
    for (const transaction of transactions) {
      const label = getLabelWithTags(transaction)
      log('debug', `Applying model to ${label}`)

      const { category, proba } = maxBy(
        classifier.categorize(label).likelihoods,
        'proba'
      )

      transaction.cozyCategoryId = category
      transaction.cozyCategoryProba = proba

      log('debug', `Results for ${label} :`)
      log('debug', `cozyCategory: ${category}`)
      log('debug', `cozyProba: ${proba}`)
    }

    return transactions
  }

  return { categorize }
}

module.exports = {
  createModel
}
