const { createClassifier } = require('./classifier')
const { getLabelWithTags, tokenizer } = require('../helpers')
const { pctOfTokensInVoc } = require('./helpers')
const maxBy = require('lodash/maxBy')
const logger = require('cozy-logger')
const {
  LOCAL_MODEL_CATEG_FALLBACK,
  LOCAL_MODEL_PROBA_FALLBACK,
  LOCAL_MODEL_PCT_TOKENS_IN_VOC_THRESHOLD
} = require('./constants')

const log = logger.namespace('categorization/localModel/model')

async function createModel(options) {
  const { pretrainedClassifier, ...remainingOptions } = options

  let classifier
  if (pretrainedClassifier) {
    log('debug', 'Using a pretrained classifier')
    classifier = pretrainedClassifier
  } else {
    log('debug', 'Create a new local classifier')
    classifier = await createClassifier(remainingOptions)
  }

  const vocabulary = Object.keys(classifier.vocabulary)

  const categorize = transactions => {
    for (const transaction of transactions) {
      const label = getLabelWithTags(transaction)
      const tokens = tokenizer(transaction.label)
      const pctOfThisTokensInVoc = pctOfTokensInVoc(tokens, vocabulary)
      let category
      let proba
      // First : check if tokens from the transaction's label are in the model
      if (pctOfThisTokensInVoc > LOCAL_MODEL_PCT_TOKENS_IN_VOC_THRESHOLD) {
        // If OK : continue
        log('debug', `Applying model to ${label}`)
        ;({ category, proba } = maxBy(
          classifier.categorize(label).likelihoods,
          'proba'
        ))
        transaction.localCategoryId = category
        transaction.localCategoryProba = proba
      } else {
        // If KO : abort with category '0' and proba 1/nbUniqueCat
        log('debug', `Giving up for ${label}`)
        category = LOCAL_MODEL_CATEG_FALLBACK
        proba = LOCAL_MODEL_PROBA_FALLBACK
        transaction.localCategoryId = category
        transaction.localCategoryProba = proba
      }
      log('debug', `Results for ${label} :`)
      log('debug', `localCategory: ${category}`)
      log('debug', `localProba: ${proba}`)
    }
  }

  return { categorize, classifier }
}

module.exports = {
  createModel
}
