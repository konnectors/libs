const {
  findByMangoQuerySimple,
  findNeighboringOperations
} = require('./findNeighboringOperations')
jest.mock('../../cozyclient')
const cozyClient = require('../../cozyclient')

beforeEach(function () {
  const INDEX = 'index'
  cozyClient.data.defineIndex.mockReturnValue(Promise.resolve(INDEX))
})

const asyncResolve = value => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(value)
    }, 1)
  })
}

describe('findByMangoQuerySimple', () => {
  it('should work', () => {
    const operations = [
      { amount: 5 },
      { amount: 6 },
      { amount: 7 },
      { amount: 8 },
      { amount: 9 },
      { amount: 10 }
    ]

    const greaterThanSeven = findByMangoQuerySimple(operations, {
      selector: {
        amount: {
          $gt: 7
        }
      }
    })
    expect(greaterThanSeven.length).toBe(3)

    const equalToEight = findByMangoQuerySimple(operations, {
      selector: {
        amount: {
          $gt: 7,
          $lt: 9
        }
      }
    })
    expect(equalToEight.length).toBe(1)
  })
})

xdescribe('findNeighboringOperations', () => {
  test('when query return length equal to stack limit, fetchAll loop', async () => {
    const ops1 = new Array(100)
    const ops2 = new Array(100)
    const ops3 = new Array(21)
    cozyClient.data.query.mockReturnValueOnce(asyncResolve(ops1))
    cozyClient.data.query.mockReturnValueOnce(asyncResolve(ops2))
    cozyClient.data.query.mockReturnValueOnce(asyncResolve(ops3))
    const bill = {}
    const options = {}
    const operations = await findNeighboringOperations(
      cozyClient,
      bill,
      options
    )
    expect(cozyClient.data.query.mock.calls.length).toBe(3)
    expect(operations.length).toBe(ops1.length + ops2.length + ops3.length)
  })
})
