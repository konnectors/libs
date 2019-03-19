const logger = require('cozy-logger')
const uniq = require('lodash/uniq')
const maxBy = require('lodash/maxBy')
const bayes = require('classificator')
const { getLabelWithTags, tokenizer } = require('./helpers')
const fetchTransactionsWithManualCat = require('./fetchTransactionsWithManualCat')

const log = logger.namespace('local-categorization-model')

const ALPHA_MIN = 2
const ALPHA_MAX = 4
const ALPHA_MAX_SMOOTHING = 12
const FAKE_TRANSACTION = {
  label: 'thisisafaketransaction',
  manualCategoryId: '0'
}
const LOCAL_MODEL_CATEG_FALLBACK = '0'
const LOCAL_MODEL_PROBA_FALLBACK = 0.1
const LOCAL_MODEL_PCT_TOKENS_IN_VOC_THRESHOLD = 0.1

/**
 * List of every combinations of tokens related to amounts:
 * - a tag for the amount's sign
 * - a tag for the amount's magnitude
 */
const TOKENS_TO_REWEIGHT = [
  'tag_neg',
  'tag_v_b_expense',
  'tag_neg tag_v_b_expense',
  'tag_b_expense',
  'tag_neg tag_b_expense',
  'tag_expense',
  'tag_neg tag_expense',
  'tag_noise_neg',
  'tag_neg tag_noise_neg',
  'tag_pos',
  'tag_noise_pos',
  'tag_pos tag_noise_pos',
  'tag_income',
  'tag_pos tag_income',
  'tag_b_income',
  'tag_pos tag_b_income',
  'tag_activity_income',
  'tag_pos tag_activity_income'
]

const getUniqueCategories = transactions => {
  return uniq(transactions.map(t => t.manualCategoryId))
}

const getAlphaParameter = (nbUniqueCategories, min, max, maxSmoothing) => {
  if (nbUniqueCategories === 1) {
    return 1
  } else {
    const alpha = maxSmoothing / (nbUniqueCategories + 1)
    return Math.max(min, Math.min(max, alpha))
  }
}

const getClassifierOptions = transactionsWithManualCat => {
  const uniqueCategories = getUniqueCategories(transactionsWithManualCat)
  const nbUniqueCategories = uniqueCategories.length
  log(
    'debug',
    'Number of unique categories in transactions with manual categories: ' +
      nbUniqueCategories
  )
  const alpha = getAlphaParameter(
    nbUniqueCategories,
    ALPHA_MIN,
    ALPHA_MAX,
    ALPHA_MAX_SMOOTHING
  )
  log('debug', 'Alpha parameter value is ' + alpha)

  let addFakeTransaction = false
  if (nbUniqueCategories === 1) {
    log(
      'info',
      'Not enough different categories, adding a fake transaction to balance the weight of the categories'
    )
    addFakeTransaction = true
  }

  return {
    initialization: { alpha, fitPrior: false },
    configuration: { addFakeTransaction }
  }
}

/**
 * Create a ready to use classifier for the local categorization model
 * @param {Array} transactionsToLearn - Transactions to learn from
 * @param {Object} intializationOptions - Options to pass to the classifier initialization
 * @param {Object} configurationOptions - Options used to configure the classifier
 */
const createLocalClassifier = (
  transactionsToLearn,
  initializationOptions,
  configurationOptions
) => {
  if (transactionsToLearn.length === 0) {
    log(
      'info',
      'Impossible to instanciate a classifier since there is no manually categorized transactions to learn from'
    )
    return null
  }

  const classifier = bayes(initializationOptions)

  log('info', 'Learning from manually categorized transactions')
  for (const transaction of transactionsToLearn) {
    classifier.learn(
      getLabelWithTags(transaction),
      transaction.manualCategoryId
    )
  }

  if (configurationOptions.addFakeTransaction) {
    classifier.learn(FAKE_TRANSACTION.label, FAKE_TRANSACTION.manualCategoryId)
  }

  return classifier
}

const createLocalModel = async classifierOptions => {
  log('info', 'Fetching manually categorized transactions')
  const transactionsWithManualCat = await fetchTransactionsWithManualCat()
  log(
    'info',
    `Fetched ${
      transactionsWithManualCat.length
    } manually categorized transactions`
  )

  log('info', 'Instanciating a new classifier')

  const options = getClassifierOptions(transactionsWithManualCat)
  const classifier = createLocalClassifier(
    transactionsWithManualCat,
    { ...classifierOptions, ...options.initialization },
    options.configuration
  )
  return classifier
}

/**
 * Reweights a word in the Naive Bayes parameter in order to mimic the
 * behavior of a sublinear TF-IDF vectorizer applied to this word.
 * The transformation applied is inspired by the scikit-learn object
 * `sklearn.feature_extraction.text.TfidfVectorizer` with `sublinear_tf`.
 * The `log(frequencyCount)` smooths the probabilities of a word across the
 * possible categories to avoid the probability of the most targeted category
 * to explode.
 * @param {*} classifier - classifier to reweight
 * @param {*} category - category in which to reweight a word
 * @param {*} word  - word to reweight
 * @param {*} frequencyCount - observed frequency count of this word in the given category
 */
const reweightWord = (classifier, category, word, frequencyCount) => {
  const newFrequencyCount = 1 + Math.log(frequencyCount)
  const deltaFrequencyCount = frequencyCount - newFrequencyCount
  // update the right entries of the classifier's parameters
  classifier.vocabulary[word] -= deltaFrequencyCount
  classifier.wordCount[category] -= deltaFrequencyCount
  classifier.wordFrequencyCount[category][word] = newFrequencyCount
}

const reweightModel = classifier => {
  // loop over categories in the wordFrequencyCat attribute
  const wordFrequencyCount = classifier.wordFrequencyCount
  // for each category
  for (const category of Object.keys(wordFrequencyCount)) {
    // extract its word-frequency count `wfc`
    const categoryWordsFrequencyCounts = wordFrequencyCount[category]
    // and search for tokens to reweight in it
    TOKENS_TO_REWEIGHT.map(wordToReweight => {
      if (categoryWordsFrequencyCounts.hasOwnProperty(wordToReweight)) {
        // for every tokens to reweight : re-compute frequency count `fc`
        const frequencyCount = categoryWordsFrequencyCounts[wordToReweight]
        if (frequencyCount !== 1) {
          reweightWord(classifier, category, wordToReweight, frequencyCount)
        }
      }
    })
  }
}

const pctOfTokensInVoc = (tokens, vocabularyArray) => {
  const n_tokens = tokens.length
  const intersection = tokens.filter(t => -1 !== vocabularyArray.indexOf(t))
  return intersection.length / n_tokens
}

const localModel = async (classifierOptions, transactions) => {
  const classifier = await createLocalModel(classifierOptions)

  if (classifier) {
    log(
      'info',
      'Reweighting model to lower the impact of amount in the prediction'
    )
    reweightModel(classifier)

    log('info', `Applying model to ${transactions.length} transactions`)

    log(
      'info',
      'Reweighting model to lower the impact of amount in the prediction'
    )
    reweightModel(classifier)

    const vocabulary = Object.keys(classifier.vocabulary)
    for (const transaction of transactions) {
      const label = getLabelWithTags(transaction)
      const tokens = tokenizer(transaction.label)
      const pctOfThisTokensInVoc = pctOfTokensInVoc(tokens, vocabulary)
      let category
      let proba
      // First : check if tokens from the transaction's label are in the model
      if (pctOfThisTokensInVoc > LOCAL_MODEL_PCT_TOKENS_IN_VOC_THRESHOLD) {
        // If OK : continue
        log('info', `Applying model to ${label}`)
        ;({ category, proba } = maxBy(
          classifier.categorize(label).likelihoods,
          'proba'
        ))
        transaction.localCategoryId = category
        transaction.localCategoryProba = proba
      } else {
        // If KO : abort with category '0' and proba 1/nbUniqueCat
        log('info', `Giving up for ${label}`)
        category = LOCAL_MODEL_CATEG_FALLBACK
        proba = LOCAL_MODEL_PROBA_FALLBACK
        transaction.localCategoryId = category
        transaction.localCategoryProba = proba
      }
      log('info', `Results for ${label} :`)
      log('info', `localCategory: ${category}`)
      log('info', `localProba: ${proba}`)
    }
  } else {
    log('info', 'No classifier, impossible to categorize transactions')
  }
}

module.exports = {
  getUniqueCategories,
  getAlphaParameter,
  createLocalClassifier,
  localModel,
  LOCAL_MODEL_PROBA_FALLBACK
}
