/**
 * @jest-environment node
 */

const createClassifier = require('./globalModel').createClassifier
const { tokenizer, predictProbaMax, categorize } = require('./helpers')
const expectedResults = require('./__mocks__/expectedResults.json')

jest.mock('./globalModel')

describe('estimate proba', () => {
  const expectedProbas = expectedResults.proba
  const classifier = createClassifier(undefined, { tokenizer })

  const N_DIGITS = 3
  it('Should compute correct probabilities', () => {
    expectedProbas.map(entry => {
      expect(predictProbaMax(classifier, entry.label)).toBeCloseTo(
        entry.proba,
        N_DIGITS
      )
    })
  })
})

describe('categorize', () => {
  const expectedCategories = expectedResults.categoryId
  const classifier = createClassifier(undefined, { tokenizer })

  it('Should categorize transactions', () => {
    expectedCategories.map(entry => {
      expect(categorize(classifier, entry.label)).toEqual(entry.categoryId)
    })
  })
})
