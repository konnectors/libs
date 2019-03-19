const cozyClient = require('../cozyclient')
const { BankTransaction } = require('cozy-doctypes')

BankTransaction.registerClient(cozyClient)

async function fetchTransactionsWithManualCat() {
  const transactionsWithManualCat = await BankTransaction.queryAll({
    manualCategoryId: { $exists: true }
  })

  return transactionsWithManualCat
}

module.exports = fetchTransactionsWithManualCat
