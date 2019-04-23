const { fetchParameters } = require('./parameters')
const { createClassifier } = require('./classifier')
const { getLabelWithTags } = require('../helpers')
const maxBy = require('lodash/maxBy')
const logger = require('cozy-logger')

const log = logger.namespace('categorization/globalModel')

async function createModel(options) {
  log('info', 'Fetching parameters from the stack')
  const parameters = await fetchParameters()
  log('info', 'Successfully fetched parameters from the stack')

  log('info', 'Instanciating a new classifier')
  const classifier = createClassifier(parameters, options)

  const categorize = transactions => {
    for (const transaction of transactions) {
      const label = getLabelWithTags(transaction)
      log('info', `Applying model to ${label}`)

      const { category, proba } = maxBy(
        classifier.categorize(label).likelihoods,
        'proba'
      )

      transaction.cozyCategoryId = category
      transaction.cozyCategoryProba = proba

      log('info', `Results for ${label} :`)
      log('info', `cozyCategory: ${category}`)
      log('info', `cozyProba: ${proba}`)
    }

    return transactions
  }

  return { categorize }
}

module.exports = {
  createModel
}
