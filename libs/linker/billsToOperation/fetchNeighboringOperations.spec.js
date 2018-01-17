import { fetchNeighboringOperations } from './fetchNeighboringOperations'
jest.mock('../../cozyclient')
const cozyClient = require('../../cozyclient')

beforeEach(function () {
  const INDEX = 'index'
  cozyClient.data.defineIndex.mockReturnValue(Promise.resolve(INDEX))
})

const asyncResolve = (value) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(value)
    }, 1)
  })
}

describe('fetchNeighboringOperations', () => {
  test('when query return length equal to stack limit, fetchAll loop', () => {
    const ops1 = new Array(100)
    const ops2 = new Array(100)
    const ops3 = new Array(21)
    cozyClient.data.query.mockReturnValueOnce(asyncResolve(ops1))
    cozyClient.data.query.mockReturnValueOnce(asyncResolve(ops2))
    cozyClient.data.query.mockReturnValueOnce(asyncResolve(ops3))
    const bill = {}
    const options = {}
    return fetchNeighboringOperations(cozyClient, bill, options)
      .then(operations => {
        expect(cozyClient.data.query.mock.calls.length).toBe(3)
        expect(operations.length).toBe(ops1.length + ops2.length + ops3.length)
      })
  })
})
