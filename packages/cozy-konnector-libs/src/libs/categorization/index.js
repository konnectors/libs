const { tokenizer } = require('./helpers')
const { globalModel } = require('./globalModel')
const { localModel } = require('./localModel')

const categorize = async transactions => {
  const classifierOptions = { tokenizer }

  await Promise.all([
    globalModel(classifierOptions, transactions),
    localModel(classifierOptions, transactions)
  ])

  return transactions
}

module.exports = categorize
