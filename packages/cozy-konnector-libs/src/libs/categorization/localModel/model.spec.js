const { createModel } = require('./model')
const { tokenizer } = require('../helpers')
const { LOCAL_MODEL_PROBA_FALLBACK } = require('./constants')
const logger = require('cozy-logger')

logger.setLevel('error')

jest.mock('./parameters')

describe('createModel', () => {
  let transactions

  beforeEach(() => {
    transactions = [
      { amount: 3001.71, label: 'AAAA BBBB' },
      { amount: -37.71, label: 'CCCC DDDD' },
      { amount: -387.71, label: 'EEEE' },
      { amount: 387.71, label: 'HHHH AAAA BBBB' },
      { amount: -907.71, label: 'FFFF GGGG' }
    ]
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should correctly categorize transactions', async () => {
    const model = await createModel({ tokenizer })
    model.categorize(transactions)

    expect(transactions[0].localCategoryProba).toBeCloseTo(0.8072, 3)
    expect(transactions[1].localCategoryProba).toBeCloseTo(
      LOCAL_MODEL_PROBA_FALLBACK,
      3
    )
    expect(transactions[2].localCategoryProba).toBeCloseTo(
      LOCAL_MODEL_PROBA_FALLBACK,
      3
    )
    expect(transactions[3].localCategoryProba).toBeCloseTo(0.6667, 3)
    expect(transactions[4].localCategoryProba).toBeCloseTo(
      LOCAL_MODEL_PROBA_FALLBACK,
      3
    )
  })
})
