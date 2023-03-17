import getFileIfExists from './getFileIfExists'

describe('getFileIfExists', function () {
  function setup() {
    const statByPath = jest.fn()
    const queryAll = jest.fn()
    const client = {
      queryAll,
      collection: () => ({
        statByPath
      })
    }
    return {
      statByPath,
      queryAll,
      client
    }
  }

  it('should use metadata if fileIdAttributes, slug and sourceAccountIdentifier are present', async () => {
    const { client, queryAll } = setup()
    queryAll.mockResolvedValue([{ _id: 'abcd' }]) // Mocking the return with a simple file obj
    const file = await getFileIfExists({
      client,
      entry: {
        filename: 'filename'
      },
      options: {
        fileIdAttributes: ['filename'],
        sourceAccountIdentifier: 'Identifier'
      },
      folderPath: '/fakepath',
      slug: 'slug'
    })
    // Test that the Q request cotains our parameters
    expect(queryAll).toHaveBeenCalledWith(
      expect.objectContaining({
        selector: expect.objectContaining({
          cozyMetadata: expect.objectContaining({
            createdByApp: 'slug',
            sourceAccountIdentifier: 'Identifier'
          }),
          metadata: expect.objectContaining({ fileIdAttributes: 'filename' })
        })
      })
    )
    expect(file).toStrictEqual({ _id: 'abcd' })
  })

  it('should roll back to filename when with metadata return nothing', async () => {
    const { client, queryAll, statByPath } = setup()
    queryAll.mockResolvedValue(undefined) // Mocking an empty return
    statByPath.mockResolvedValue({ data: { _id: 'abcd' } })
    const file = await getFileIfExists({
      client,
      entry: {
        filename: 'filename'
      },
      options: {
        fileIdAttributes: ['filename'],
        sourceAccountIdentifier: 'Identifier'
      },
      folderPath: '/fakepath',
      slug: 'slug'
    })
    expect(queryAll).toHaveBeenCalledWith(
      expect.objectContaining({
        selector: expect.objectContaining({
          cozyMetadata: expect.objectContaining({
            createdByApp: 'slug',
            sourceAccountIdentifier: 'Identifier'
          }),
          metadata: expect.objectContaining({ fileIdAttributes: 'filename' })
        })
      })
    )
    expect(statByPath).toHaveBeenCalledWith('/fakepath/filename')
    expect(file).toStrictEqual({ _id: 'abcd' })
  })

  it('shoud use filename if sourceAccountIdentifier is missing', async () => {
    const { statByPath, client } = setup()
    statByPath.mockResolvedValue({ data: { _id: 'abcd' } })
    const file = await getFileIfExists({
      client,
      entry: {
        filename: 'filename'
      },
      options: { fileIdAttributes: ['filename'] },
      folderPath: '/fakepath',
      slug: 'slug'
    })
    expect(statByPath).toHaveBeenCalledWith('/fakepath/filename')
    expect(file).toStrictEqual({ _id: 'abcd' })
  })

  it('shoud use filename if slug is missing', async () => {
    const { statByPath, client } = setup()
    statByPath.mockResolvedValue({ data: { _id: 'abcd' } })
    const file = await getFileIfExists({
      client,
      entry: {
        filename: 'filename'
      },
      options: {
        fileIdAttributes: ['filename'],
        sourceAccountIdentifier: 'Identifier'
      },
      folderPath: '/fakepath'
    })
    expect(statByPath).toHaveBeenCalledWith('/fakepath/filename')
    expect(file).toStrictEqual({ _id: 'abcd' })
  })
  it('shoud use filename if fileIdAttributes is missing', async () => {
    const { statByPath, client } = setup()
    statByPath.mockResolvedValue({ data: { _id: 'abcd' } })
    const file = await getFileIfExists({
      client,
      entry: {
        filename: 'filename'
      },
      options: { sourceAccountIdentifier: 'Identifier' },
      folderPath: '/fakepath',
      slug: 'slug'
    })
    expect(statByPath).toHaveBeenCalledWith('/fakepath/filename')
    expect(file).toStrictEqual({ _id: 'abcd' })
  })
})
