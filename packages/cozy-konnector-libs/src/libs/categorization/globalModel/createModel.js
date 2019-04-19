const logger = require('cozy-logger')
const fetchParameters = require('./fetchParameters')
const createClassifier = require('./createClassifier')
const categorize = require('./categorize')

const log = logger.namespace('global-categorization-model/createModel')

async function createModel(classifierOptions) {
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

  return {
    categorize: transactions => categorize(classifier, transactions)
  }
}

module.exports = createModel
