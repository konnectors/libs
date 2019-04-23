const { createClassifier } = require('./classifier')
const { fetchTransactionsWithManualCat } = require('./parameters')

jest.mock('./parameters')

describe('createClassifier', () => {
  it('should throw if there is no manually categorized transactions', async () => {
    fetchTransactionsWithManualCat.mockResolvedValueOnce([])

    await expect(createClassifier()).rejects.toThrow()
  })
})
