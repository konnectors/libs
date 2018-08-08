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
const { fetchAll, queryAll } = require('./utils')

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
