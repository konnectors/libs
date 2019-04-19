const logger = require('cozy-logger')
const maxBy = require('lodash/maxBy')
const { getLabelWithTags } = require('../helpers')
const fetchParameters = require('./fetchParameters')
const createClassifier = require('./createClassifier')

const log = logger.namespace('global-categorization-model/createModel')

async function globalModel(classifierOptions, transactions) {
  log('info', 'Fetching parameters from the stack')
  let parameters

  try {
    parameters = await fetchParameters()
    log('info', 'Successfully fetched parameters from the stack')
  } catch (e) {
    log('info', e)
    return
  }

  log('info', 'Instanciating a new classifier')
  const classifier = createClassifier(parameters, classifierOptions)

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
}

module.exports = {
  createClassifier,
  globalModel
}
