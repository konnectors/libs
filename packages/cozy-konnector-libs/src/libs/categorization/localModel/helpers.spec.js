const { getUniqueCategories, getAlphaParameter } = require('./helpers')

describe('getUniqueCategories', () => {
  it('Should return the list of unique categories for the given transactions', () => {
    const transactions = [
      { manualCategoryId: '200100' },
      { manualCategoryId: '200100' },
      { manualCategoryId: '400100' },
      { manualCategoryId: '400400' },
      { manualCategoryId: '400400' },
      { manualCategoryId: '600170' }
    ]

    const expected = ['200100', '400100', '400400', '600170']

    expect(getUniqueCategories(transactions)).toEqual(expected)
  })
})

describe('getAlphaParemeter', () => {
  const MIN = 2
  const MAX = 4
  const MAX_SMOOTHING = 12

  it('Should answer 1 if only one unique category is used', () => {
    const nbUniqueCategories = 1
    const alpha = getAlphaParameter(nbUniqueCategories, MIN, MAX, MAX_SMOOTHING)

    expect(alpha).toBe(1)
  })

  it('Should never be lesser than the passed min parameter', () => {
    const nbUniqueCategories = 500
    const alpha = getAlphaParameter(nbUniqueCategories, MIN, MAX, MAX_SMOOTHING)

    expect(alpha).toBe(MIN)
  })

  it('Should never be higher than the passed max parameter', () => {
    const nbUniqueCategories = 2
    const alpha = getAlphaParameter(nbUniqueCategories, MIN, MAX, MAX_SMOOTHING)

    expect(alpha).toBe(MAX)
  })

  it('Should return the right value between MIN and MAX', () => {
    expect(getAlphaParameter(10, MIN, MAX, MAX_SMOOTHING)).toBe(2)
    expect(getAlphaParameter(20, MIN, MAX, MAX_SMOOTHING)).toBe(2)
    expect(getAlphaParameter(3, MIN, MAX, MAX_SMOOTHING)).toBe(3)
  })
})
