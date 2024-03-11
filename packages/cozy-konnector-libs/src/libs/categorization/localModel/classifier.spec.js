const logger = require('cozy-logger')

const { createClassifier } = require('./classifier')
const { fetchTransactionsWithManualCat } = require('./parameters')

logger.setLevel('error')
jest.mock('./parameters')

describe('createClassifier', () => {
  it('should throw if there is no manually categorized transactions', async () => {
    fetchTransactionsWithManualCat.mockResolvedValueOnce([])

    await expect(createClassifier()).rejects.toThrow()
  })
})
