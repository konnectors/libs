const DATE_TAG = ' tag_date '
const DATE_REGEX = /\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}\/\d{1,2}/g
const UNNECESSARY_CHARS_REGEX = /[^a-zA-Z_ ]/g
const MAX_WORD = 3
const DEFAULT_CATEGORY = '0'
const PROBA_LIMIT = 10 / 100
const DESIRED_TAGS = ['sign', 'amount', 'label']

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

  const categoryId =
    predicted.likelihoods[0].proba > PROBA_LIMIT
      ? predicted.predictedCategory
      : DEFAULT_CATEGORY

  return categoryId
}

const getTransactionLabel = transaction => transaction.label.toLowerCase()

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

const getDayOfMonthTag = dateStr => {
  const dayOfMonthStr = Number(dateStr.slice(9, 10))
  if (dayOfMonthStr < 4 || dayOfMonthStr >= 28) {
    return 'tag_A'
  } else if (dayOfMonthStr < 12 && dayOfMonthStr >= 4) {
    return 'tag_B'
  } else if (dayOfMonthStr < 20 && dayOfMonthStr >= 12) {
    return 'tag_C'
  } else if (dayOfMonthStr < 28 && dayOfMonthStr >= 20) {
    return 'tag_D'
  }
}

const getDigitsTag = amount => {
  const amountString = String(amount)
  return amountString.includes('.') ? 'tag_float' : 'tag_integer'
}

const getLabelWithTags = transaction => {
  let label = ''
  for (const keyword of DESIRED_TAGS) {
    if (keyword.includes('amount')) {
      const tag = getAmountTag(transaction.amount)
      label = `${label} ${tag}`
    } else if (keyword.includes('sign')) {
      const tag = getAmountSignTag(transaction.amount)
      label = `${label} ${tag}`
    } else if (keyword.includes('day')) {
      const tag = getDayOfMonthTag(transaction.date)
      label = `${label} ${tag}`
    } else if (keyword.includes('label')) {
      const tag = transaction.label.toLowerCase()
      label = `${label} ${tag}`
    } else if (keyword.includes('digits')) {
      const tag = getDigitsTag(transaction.amount)
      label = `${label} ${tag}`
    } else if (keyword.includes('original')) {
      const tag = getTransactionLabel(transaction).toLowerCase()
      label = `${label} ${tag}`
    }
  }
  return label
}

module.exports = {
  tokenizer,
  predictProbaMax,
  categorize,
  getLabelWithTags
}
