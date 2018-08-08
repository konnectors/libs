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
const { fetchAll, queryAll, findDuplicates } = require('./utils')

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
  const db = [
    { name: 'Thanos', id: 1 },
    { name: 'Beyonder', id: 2 },
    { name: 'Beyonder', id: 3 },
    { name: 'Kubik', id: 4 },
    { name: 'Kubik', id: 4 },
    { name: 'Solar', id: 1 },
    { name: 'Spawn', id: 4 }
  ]

  it('should find duplicates and uniques', async () => {
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
  it('should works with an empty list', async () => {
    cozy.fetchJSON.mockReturnValue(asyncResolve({ rows: [] }))
    const { toKeep, toRemove } = await findDuplicates('io.cozy.marvel', {
      keys: ['name', 'id']
    })

    expect(toKeep).toEqual([])
    expect(toRemove).toEqual([])
  })
})
