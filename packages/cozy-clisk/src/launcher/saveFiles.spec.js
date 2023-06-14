import saveFiles from './saveFiles'

describe('saveFiles', function () {
  it('should not download a file if the file is already present', async () => {
    const fileDocument = {
      _type: 'io.cozy.files',
      type: 'file',
      data: 'already present file content',
      dirId: '/test/folder/path',
      name: 'old file name.txt',
      cozyMetadata: {
        sourceAccount: 'testsourceaccount',
        sourceAccountIdentifier: 'testsourceaccountidentifier'
      },
      metadata: {
        fileIdAttributes: 'old file name.txt'
      }
    }
    const existingFilesIndex = new Map([['old file name.txt', fileDocument]])
    const client = {
      save: jest.fn(),
      collection: () => ({
        statByPath: jest.fn().mockImplementation(path => {
          return { data: { _id: path } }
        })
      })
    }

    const downloadAndFormatFile = jest.fn()

    const document = {
      fileurl: 'https://myfile.txt',
      filename: 'old file name.txt'
    }
    const result = await saveFiles(client, [document], '/test/folder/path', {
      manifest: {
        slug: 'testslug'
      },
      sourceAccount: 'testsourceaccount',
      sourceAccountIdentifier: 'testsourceaccountidentifier',
      fileIdAttributes: ['filename'],
      existingFilesIndex,
      downloadAndFormatFile
    })

    expect(downloadAndFormatFile).not.toHaveBeenCalled()

    expect(result).toStrictEqual([
      {
        ...document,
        fileDocument
      }
    ])
  })
  it('should download a file with fileurl and without filestream', async () => {
    const client = {
      save: jest.fn().mockImplementation(doc => ({
        data: doc
      })),
      collection: () => ({
        statByPath: jest.fn().mockImplementation(path => {
          return { data: { _id: path } }
        })
      })
    }

    const downloadAndFormatFile = jest.fn().mockResolvedValue({
      filestream: 'downloaded file content'
    })

    const document = {
      fileurl: 'https://myfile.txt',
      filename: 'file name.txt'
    }
    const result = await saveFiles(client, [document], '/test/folder/path', {
      manifest: {
        slug: 'testslug'
      },
      sourceAccount: 'testsourceaccount',
      sourceAccountIdentifier: 'testsourceaccountidentifier',
      fileIdAttributes: ['filename'],
      existingFilesIndex: new Map(),
      downloadAndFormatFile
    })

    const fileDocument = {
      _type: 'io.cozy.files',
      type: 'file',
      data: 'downloaded file content',
      dirId: '/test/folder/path',
      name: 'file name.txt',
      sourceAccount: 'testsourceaccount',
      sourceAccountIdentifier: 'testsourceaccountidentifier',
      metadata: {
        fileIdAttributes: 'file name.txt'
      }
    }
    expect(client.save).toHaveBeenCalledWith(fileDocument)
    expect(result).toStrictEqual([
      {
        ...document,
        fileDocument
      }
    ])
  })
  it('should save a file with filestream without subPath', async () => {
    const client = {
      save: jest.fn().mockImplementation(doc => ({
        data: doc
      })),
      collection: () => ({
        statByPath: jest.fn().mockImplementation(path => {
          return { data: { _id: path } }
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
      sourceAccountIdentifier: 'testsourceaccountidentifier',
      fileIdAttributes: ['filename'],
      existingFilesIndex: new Map()
    })
    const fileDocument = {
      _type: 'io.cozy.files',
      type: 'file',
      data: 'filestream content',
      dirId: '/test/folder/path',
      name: 'file name.txt',
      sourceAccount: 'testsourceaccount',
      sourceAccountIdentifier: 'testsourceaccountidentifier',
      metadata: {
        fileIdAttributes: 'file name.txt'
      }
    }
    expect(client.save).toHaveBeenCalledWith(fileDocument)
    expect(result).toStrictEqual([
      {
        ...document,
        fileDocument
      }
    ])
  })
  it('should save a file with qualification label', async () => {
    const client = {
      save: jest.fn().mockImplementation(doc => ({
        data: doc
      })),
      collection: () => ({
        statByPath: jest.fn().mockImplementation(path => {
          return { data: { _id: path } }
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
      sourceAccountIdentifier: 'testsourceaccountidentifier',
      fileIdAttributes: ['filename'],
      existingFilesIndex: new Map(),
      qualificationLabel: 'energy_invoice'
    })
    const fileDocument = {
      _type: 'io.cozy.files',
      type: 'file',
      data: 'filestream content',
      dirId: '/test/folder/path',
      name: 'file name.txt',
      sourceAccount: 'testsourceaccount',
      sourceAccountIdentifier: 'testsourceaccountidentifier',
      metadata: {
        fileIdAttributes: 'file name.txt',
        qualification: {
          label: 'energy_invoice',
          purpose: 'invoice',
          sourceCategory: 'energy'
        }
      }
    }
    expect(client.save).toHaveBeenCalledWith(fileDocument)
    expect(result).toEqual([
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
          return { data: { _id: path } }
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
      sourceAccountIdentifier: 'testsourceaccountidentifier',
      fileIdAttributes: ['filename'],
      existingFilesIndex: new Map()
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
