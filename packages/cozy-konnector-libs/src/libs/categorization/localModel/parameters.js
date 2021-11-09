const cozyClient = require('../../cozyclient')
const { Q } = require('cozy-client')

async function fetchTransactionsWithManualCat() {
  const client = cozyClient.new

  const query = Q('io.cozy.bank.operations')
    .where({
      manualCategoryId: { $gt: null }
    })
    .partialIndex({
      manualCategoryId: {
        $exists: true
      }
    })
    .indexFields(['manualCategoryId'])

  return client.queryAll(query)
}

module.exports = {
  fetchTransactionsWithManualCat
}
