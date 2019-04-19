const logger = require('cozy-logger')
const maxBy = require('lodash/maxBy')
const { getLabelWithTags } = require('../helpers')

const log = logger.namespace('global-categorization-model/categorize')

const categorize = (classifier, transactions) => {
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

module.exports = categorize
