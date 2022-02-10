module.exports = {
  fetchTransactionsWithManualCat: jest.fn().mockResolvedValue([
    { amount: 3001.71, label: 'AAAA BBBB', manualCategoryId: '200110' },
    { amount: 3001.71, label: 'AAAA BBBB', manualCategoryId: '200110' }
  ])
}
