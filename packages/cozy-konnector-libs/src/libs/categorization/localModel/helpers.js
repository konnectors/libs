const uniq = require('lodash/uniq')

const getUniqueCategories = transactions => {
  return uniq(transactions.map(t => t.manualCategoryId))
}

const pctOfTokensInVoc = (tokens, vocabularyArray) => {
  const n_tokens = tokens.length
  const intersection = tokens.filter(t => -1 !== vocabularyArray.indexOf(t))
  return intersection.length / n_tokens
}

const getAlphaParameter = (nbUniqueCategories, min, max, maxSmoothing) => {
  if (nbUniqueCategories === 1) {
    return 1
  } else {
    const alpha = maxSmoothing / (nbUniqueCategories + 1)
    return Math.max(min, Math.min(max, alpha))
  }
}

module.exports = {
  getUniqueCategories,
  pctOfTokensInVoc,
  getAlphaParameter
}
