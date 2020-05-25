const { BankTransaction } = require('cozy-doctypes')

async function fetchTransactionsWithManualCat() {
  const transactionsWithManualCat = await BankTransaction.queryAll({
    manualCategoryId: { $exists: true }
  })

  return transactionsWithManualCat
}

module.exports = {
  fetchTransactionsWithManualCat
}
