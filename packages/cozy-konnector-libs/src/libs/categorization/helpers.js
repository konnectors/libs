const DATE_TAG = ' tag_date '
const DATE_REGEX = /\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}\/\d{1,2}/g
const UNNECESSARY_CHARS_REGEX = /[^a-zA-Z_ ]/g
const MAX_WORD = 3
const DEFAULT_CATEGORY = '0'
const PROBA_LIMIT = 10 / 100

const format = label => {
  const stripAccents = label => {
    return label.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  }

  const replaceDate = label => {
    return label.replace(DATE_REGEX, DATE_TAG)
  }

  const removeUnnecessaryChars = label => {
    return label.replace(UNNECESSARY_CHARS_REGEX, '')
  }

  return removeUnnecessaryChars(replaceDate(stripAccents(label.toLowerCase())))
}

const tokenizer = text => {
  const sanitized = format(text)
  const words = sanitized.split(/\s+/).filter(token => {
    return token.length >= 2
  })
  let tokens = []
  let countWord = MAX_WORD
  while (countWord !== 0) {
    if (words.length >= countWord) {
      for (let start = 0; start + countWord < words.length + 1; start++) {
        const token = words.slice(start, start + countWord).join(' ')
        tokens.push(token)
      }
    }
    countWord--
  }
  return tokens
}

const predictProbaMax = (classifier, label) => {
  const predicted = classifier.categorize(label, true)

  return predicted.likelihoods[0].proba
}

const categorize = (classifier, label) => {
  const predicted = classifier.categorize(label, true)

  // Display likelihoods (statistic)
  // console.log(predicted.likelihoods)

  const categoryId =
    predicted.likelihoods[0].proba > PROBA_LIMIT
      ? predicted.predictedCategory
      : DEFAULT_CATEGORY

  // Display category name
  // console.log(categoryId, categorizesTree[categoryId])

  return categoryId
}

const titleRx = /(?:^|\s)\S/g
const titleCase = label =>
  label.toLowerCase().replace(titleRx, a => a.toUpperCase())

const getTransactionLabel = transaction => titleCase(transaction.label)

const getAmountSignTag = amount => (amount < 0 ? 'tag_neg' : 'tag_pos')
const getAmountTag = amount => {
  if (amount < -550) {
    return 'tag_v_b_expense'
  } else if (amount < -100) {
    return 'tag_b_expense'
  } else if (amount < -20) {
    return 'tag_expense'
  } else if (amount < 0) {
    return 'tag_noise_neg'
  } else if (amount < 50) {
    return 'tag_noise_pos'
  } else if (amount < 200) {
    return 'tag_income'
  } else if (amount < 1200) {
    return 'tag_b_income'
  } else {
    return 'tag_activity_income'
  }
}

const getLabelWithTags = transaction => {
  const label = getTransactionLabel(transaction).toLowerCase()

  const amountSignTag = getAmountSignTag(transaction.amount)
  const amountTag = getAmountTag(transaction.amount)

  return `${amountSignTag} ${amountTag} ${label}`
}

module.exports = {
  tokenizer,
  predictProbaMax,
  categorize,
  getLabelWithTags
}
