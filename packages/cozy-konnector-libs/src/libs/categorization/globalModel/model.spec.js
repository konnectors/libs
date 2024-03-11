const logger = require('cozy-logger')

const expectedResults = require('./__mocks__/expectedResults.json')
const { createClassifier } = require('./classifier')
const { createModel } = require('./model')
const { fetchParameters } = require('./parameters')
const { tokenizer } = require('../helpers')

logger.setLevel('error')

jest.mock('./parameters')
jest.mock('./classifier')

describe('createModel', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch the model parameters', async () => {
    await createModel()

    expect(fetchParameters).toHaveBeenCalled()
  })

  it('should create a classifier', async () => {
    await createModel()

    expect(createClassifier).toHaveBeenCalled()
  })

  it('should return an object with a categorize method', async () => {
    const model = await createModel()

    expect(model).toMatchObject({
      categorize: expect.any(Function)
    })
  })

  it('should correctly categorize transactions', async () => {
    const model = await createModel({ tokenizer })
    const N_DIGITS = 3

    const results = model.categorize(expectedResults)

    results.forEach(result => {
      expect(result.cozyCategoryProba).toBeCloseTo(result.proba, N_DIGITS)
      expect(result.cozyCategoryId).toEqual(result.categoryId)
    })
  })
})
