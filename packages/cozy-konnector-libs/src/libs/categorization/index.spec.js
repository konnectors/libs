/**
 * @jest-environment node
 */

const { createCategorizer } = require('.')
const { createModel: createGlobalModel } = require('./globalModel')
const { createModel: createLocalModel } = require('./localModel')

jest.mock('./globalModel')
jest.mock('./localModel')

describe('createCategorizer', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create an object with a categorize method', async () => {
    const categorizer = await createCategorizer()

    expect(typeof categorizer.categorize).toBe('function')
  })

  it('should initialize global and local models', async () => {
    await createCategorizer()

    expect(createGlobalModel).toHaveBeenCalled()
    expect(createLocalModel).toHaveBeenCalled()
  })
})
