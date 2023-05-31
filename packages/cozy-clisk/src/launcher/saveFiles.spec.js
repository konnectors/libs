import saveFiles from './saveFiles'

describe('saveFiles', function () {
  it('should save a file without subPath', async () => {
    const client = {
      save: jest.fn().mockImplementation(doc => ({
        data: doc
      })),
      collection: () => ({
        statByPath: jest.fn().mockImplementation(path => {
          if (path === '/test/folder/path/file name.txt') {
            return { data: null }
          } else {
            return { data: { _id: path } }
          }
        })
      })
    }
    const document = {
      filestream: 'filestream content',
      filename: 'file name.txt'
    }
    const result = await saveFiles(client, [document], '/test/folder/path', {
      manifest: {
        slug: 'testslug'
      },
      sourceAccount: 'testsourceaccount',
      sourceAccountIdentifier: 'testsourceaccountidentifier'
    })
    const fileDocument = {
      _type: 'io.cozy.files',
      type: 'file',
      data: 'filestream content',
      dirId: '/test/folder/path',
      name: 'file name.txt',
      sourceAccount: 'testsourceaccount',
      sourceAccountIdentifier: 'testsourceaccountidentifier'
    }
    expect(client.save).toHaveBeenCalledWith(fileDocument)
    expect(result).toStrictEqual([
      {
        ...document,
        fileDocument
      }
    ])
  })
  it('should save a file with a subPath', async () => {
    const client = {
      save: jest.fn().mockImplementation(doc => ({
        data: doc
      })),
      collection: () => ({
        createDirectoryByPath: jest.fn(),
        statByPath: jest.fn().mockImplementation(path => {
          if (path === '/test/folder/path/file name.txt') {
            return { data: null }
          } else {
            return { data: { _id: path } }
          }
        })
      })
    }
    const document = {
      filestream: 'filestream content',
      filename: 'file name.txt'
    }
    const result = await saveFiles(client, [document], '/test/folder/path', {
      manifest: {
        slug: 'testslug'
      },
      subPath: 'subPath',
      sourceAccount: 'testsourceaccount',
      sourceAccountIdentifier: 'testsourceaccountidentifier'
    })
    expect(client.save).toHaveBeenCalledWith(
      expect.objectContaining({
        dirId: '/test/folder/path/subPath'
      })
    )
    expect(result).toStrictEqual([
      {
        ...document,
        fileDocument: expect.objectContaining({
          dirId: '/test/folder/path/subPath'
        })
      }
    ])
  })
})
