jest.mock('./cozyclient', () => ({
  data: {
    query: jest.fn(),
    defineIndex: jest.fn(),
    findAll: jest.fn()
  }
}))

const db = [
  { name: 'Thanos' },
  { name: 'Beyonder' },
  { name: 'Kubik' },
  { name: 'Solar' },
  { name: 'Spawn' }
]

const sortBy = require('lodash/sortBy')

const cozy = require('./cozyclient')
const {
  queryAll,
  findDuplicates,
  sortBillsByLinkedOperationNumber,
  formatDate
} = require('./utils')

const asyncResolve = data =>
  new Promise(resolve => setImmediate(() => resolve(data)))

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

    cozy.data.findAll.mockReturnValue(asyncResolve(db))
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
    cozy.data.findAll.mockReturnValue(asyncResolve([]))
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
    cozy.data.findAll.mockReturnValueOnce(asyncResolve(bills))

    const operations = [{ bills: [2, 3, 4] }, { bills: [4, 5, 6] }]
    cozy.data.findAll.mockReturnValueOnce(asyncResolve(operations))

    const { toKeep, toRemove } = await findDuplicates('io.cozy.bills', {
      keys: ['amount']
    })

    expect(sortBy(toKeep, '_id')).toEqual([
      { amount: 2, date, vendor, _id: 4, opNb: 2 },
      { amount: 1, date, vendor, _id: 5, opNb: 1 }
    ])
    expect(sortBy(toRemove, '_id')).toEqual([
      { amount: 1, date, vendor, _id: 1, opNb: 0, original: 5 },
      { amount: 2, date, vendor, _id: 2, opNb: 1, original: 4 },
      { amount: 1, date, vendor, _id: 3, opNb: 1, original: 5 },
      { amount: 2, date, vendor, _id: 6, opNb: 1, original: 4 },
      { amount: 1, date, vendor, _id: 7, opNb: 0, original: 5 },
      { amount: 2, date, vendor, _id: 8, opNb: 0, original: 4 },
      { amount: 1, date, vendor, _id: 9, opNb: 0, original: 5 }
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

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('1995-01-30T12:00:00')
    expect(formatDate(date)).toEqual('1995-01-30')
  })
})
