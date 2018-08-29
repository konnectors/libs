jest.mock('./cozyclient', () => ({
  data: {
    query: jest.fn(),
    defineIndex: jest.fn()
  },
  fetchJSON: jest.fn()
}))

const db = [
  { name: 'Thanos' },
  { name: 'Beyonder' },
  { name: 'Kubik' },
  { name: 'Solar' },
  { name: 'Spawn' }
]

const cozy = require('./cozyclient')
const {
  fetchAll,
  queryAll,
  findDuplicates,
  sortBillsByLinkedOperationNumber
} = require('./utils')

const asyncResolve = data =>
  new Promise(resolve => setImmediate(() => resolve(data)))

describe('fetchAll', () => {
  it('should get all the doctype documents (nominal case)', async () => {
    cozy.fetchJSON.mockReturnValue(
      asyncResolve({
        rows: db.map(doc => ({
          id: '1',
          doc
        }))
      })
    )

    const result = await fetchAll('io.cozy.marvel')

    expect(result).toEqual(db)
  })

  it('should return an empty array if the doctype does not exist', async () => {
    cozy.fetchJSON.mockReturnValue(asyncResolve(null))

    const result = await fetchAll('io.cozy.marvel')

    expect(result).toEqual([])
  })
})

describe('queryAll', () => {
  it('should handle paging', async () => {
    cozy.data.query
      .mockReturnValueOnce(
        asyncResolve({
          docs: db.slice(0, 3),
          next: true
        })
      )
      .mockReturnValueOnce(
        asyncResolve({
          docs: db.slice(3)
        })
      )

    const result = await queryAll('io.cozy.marvel', {})
    expect(result).toEqual(db)
  })
})

describe('findDuplicates', () => {
  it('should find duplicates and uniques', async () => {
    const db = [
      { name: 'Thanos', id: 1 },
      { name: 'Beyonder', id: 2 },
      { name: 'Beyonder', id: 3 },
      { name: 'Kubik', id: 4 },
      { name: 'Kubik', id: 4 },
      { name: 'Solar', id: 1 },
      { name: 'Spawn', id: 4 }
    ]

    cozy.fetchJSON.mockReturnValue(
      asyncResolve({
        rows: db.map(doc => ({
          id: '1',
          doc
        }))
      })
    )
    const { toKeep, toRemove } = await findDuplicates('io.cozy.marvel', {
      keys: ['name', 'id']
    })
    expect(toKeep).toEqual([
      { name: 'Thanos', id: 1 },
      { name: 'Beyonder', id: 2 },
      { name: 'Beyonder', id: 3 },
      { name: 'Kubik', id: 4 },
      { name: 'Solar', id: 1 },
      { name: 'Spawn', id: 4 }
    ])
    expect(toRemove).toEqual([{ name: 'Kubik', id: 4 }])
  })
  it('should work with an empty list', async () => {
    cozy.fetchJSON.mockReturnValue(asyncResolve({ rows: [] }))
    const { toKeep, toRemove } = await findDuplicates('io.cozy.marvel', {
      keys: ['name', 'id']
    })

    expect(toKeep).toEqual([])
    expect(toRemove).toEqual([])
  })

  it('should keep linked bills by preference', async () => {
    const date = new Date()
    const vendor = 'vendor'
    const bills = [
      { amount: 1, date, vendor, _id: 1 },
      { amount: 2, date, vendor, _id: 2 },
      { amount: 1, date, vendor, _id: 3 },
      { amount: 2, date, vendor, _id: 4 },
      { amount: 1, date, vendor, _id: 5 },
      { amount: 2, date, vendor, _id: 6 },
      { amount: 1, date, vendor, _id: 7 },
      { amount: 2, date, vendor, _id: 8 },
      { amount: 1, date, vendor, _id: 9 }
    ]
    cozy.fetchJSON.mockReturnValueOnce(
      asyncResolve({
        rows: bills.map(doc => ({
          id: '1',
          doc
        }))
      })
    )

    const operations = [{ bills: [2, 3, 4] }, { bills: [4, 5, 6] }]
    cozy.fetchJSON.mockReturnValueOnce(
      asyncResolve({
        rows: operations.map(doc => ({
          id: '1',
          doc
        }))
      })
    )

    const { toKeep } = await findDuplicates('io.cozy.bills', {
      keys: ['amount']
    })

    expect(toKeep).toEqual([
      { amount: 2, date, vendor, _id: 4, opNb: 2 },
      { amount: 1, date, vendor, _id: 5, opNb: 1 }
    ])
  })
})

describe('sortBillsByLinkedOperationNumber', () => {
  it('should sort bills by number of linked operations', () => {
    const date = new Date()
    const vendor = 'vendor'
    const bills = [
      { amount: 1, date, vendor, _id: 1 },
      { amount: 2, date, vendor, _id: 2 },
      { amount: 1, date, vendor, _id: 3 },
      { amount: 2, date, vendor, _id: 4 },
      { amount: 1, date, vendor, _id: 5 },
      { amount: 2, date, vendor, _id: 6 },
      { amount: 1, date, vendor, _id: 7 },
      { amount: 2, date, vendor, _id: 8 },
      { amount: 1, date, vendor, _id: 9 }
    ]

    const operations = [{ bills: [2, 3, 4] }, { bills: [4, 5, 6] }]

    const expected = [
      { amount: 2, date, vendor, _id: 4, opNb: 2 },
      { amount: 2, date, vendor, _id: 6, opNb: 1 },
      { amount: 1, date, vendor, _id: 5, opNb: 1 },
      { amount: 1, date, vendor, _id: 3, opNb: 1 },
      { amount: 2, date, vendor, _id: 2, opNb: 1 },
      { amount: 1, date, vendor, _id: 9, opNb: 0 },
      { amount: 2, date, vendor, _id: 8, opNb: 0 },
      { amount: 1, date, vendor, _id: 7, opNb: 0 },
      { amount: 1, date, vendor, _id: 1, opNb: 0 }
    ]

    expect(sortBillsByLinkedOperationNumber(bills, operations)).toEqual(
      expected
    )
  })
})
