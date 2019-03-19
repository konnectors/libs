/**
 * @jest-environment node
 */

require('isomorphic-fetch')
const categorize = require('.')
const { globalModel } = require('./globalModel')
const { localModel } = require('./localModel')

jest.mock('./globalModel')
jest.mock('./localModel')

it('should apply both global and local models to transactions', async () => {
  const transactions = [{ label: 't1' }, { label: 't2' }, { label: 't3' }]

  await categorize(transactions)

  expect(globalModel).toHaveBeenCalled()
  expect(localModel).toHaveBeenCalled()
})
