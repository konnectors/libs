import saveFiles from './saveFiles'
import { dataUriToArrayBuffer } from '../libs/utils'

jest.mock('../libs/utils')

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
      query: jest.fn().mockResolvedValue({ included: [], data: null }),
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
      downloadAndFormatFile,
      log: jest.fn()
    })

    expect(downloadAndFormatFile).not.toHaveBeenCalled()

    expect(result).toStrictEqual([
      {
        ...document,
        fileDocument
      }
    ])
  })
  it('should download a file if the file is already present and has option forceReplaceFile', async () => {
    const fileDocument = {
      _id: 'existingid',
      _rev: 'existingrev',
      _type: 'io.cozy.files',
      type: 'file',
      data: 'already present file content',
      dirId: '/test/folder/path',
      name: 'file name.txt',
      cozyMetadata: {
        sourceAccount: 'testsourceaccount',
        sourceAccountIdentifier: 'testsourceaccountidentifier'
      },
      metadata: {
        fileIdAttributes: 'file name.txt'
      }
    }
    const existingFilesIndex = new Map([['file name.txt', fileDocument]])
    const client = {
      save: jest.fn().mockImplementation(doc => ({
        data: { ...doc, _rev: 'newrev' }
      })),
      query: jest.fn().mockResolvedValue({ included: [], data: null }),
      collection: () => ({
        statByPath: jest.fn().mockImplementation(path => {
          return { data: { _id: path } }
        })
      })
    }

    const downloadAndFormatFile = jest.fn().mockResolvedValue({
      dataUri: 'downloaded file content'
    })
    dataUriToArrayBuffer.mockImplementation(dataUri => ({
      arrayBuffer: dataUri + ' arrayBuffer'
    }))

    const document = {
      forceReplaceFile: true,
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
      existingFilesIndex,
      downloadAndFormatFile,
      log: jest.fn()
    })

    expect(downloadAndFormatFile).toHaveBeenCalledWith(
      expect.objectContaining({
        fileurl: 'https://myfile.txt',
        filename: 'file name.txt'
      })
    )

    const newFileDocument = {
      _id: 'existingid',
      _rev: 'newrev',
      _type: 'io.cozy.files',
      type: 'file',
      data: 'downloaded file content arrayBuffer',
      dirId: '/test/folder/path',
      name: 'file name.txt',
      sourceAccount: 'testsourceaccount',
      sourceAccountIdentifier: 'testsourceaccountidentifier',
      metadata: {
        fileIdAttributes: 'file name.txt'
      }
    }
    expect(result).toStrictEqual([
      {
        filename: 'file name.txt',
        fileDocument: newFileDocument
      }
    ])
  })
  it('should download a file with fileurl and without filestream', async () => {
    const client = {
      save: jest.fn().mockImplementation(doc => ({
        data: doc
      })),
      query: jest.fn().mockResolvedValue({ included: [], data: null }),
      collection: () => ({
        statByPath: jest
          .fn()
          .mockImplementation(async path => ({ data: { _id: path } }))
      })
    }

    dataUriToArrayBuffer.mockImplementation(dataUri => ({
      arrayBuffer: dataUri + ' arrayBuffer'
    }))

    const downloadAndFormatFile = jest.fn().mockResolvedValue({
      dataUri: 'downloaded file content'
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
      downloadAndFormatFile,
      log: jest.fn()
    })

    const fileDocument = {
      _type: 'io.cozy.files',
      type: 'file',
      data: 'downloaded file content arrayBuffer',
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
        filename: 'file name.txt',
        fileDocument
      }
    ])
  })
  it('should convert a file dataUri to ArrayBuffer', async () => {
    const client = {
      save: jest.fn().mockImplementation(doc => ({
        data: doc
      })),
      query: jest.fn().mockResolvedValue({ included: [], data: null }),
      collection: () => ({
        statByPath: jest.fn().mockImplementation(path => {
          return { data: { _id: path } }
        })
      })
    }

    dataUriToArrayBuffer.mockImplementation(dataUri => ({
      arrayBuffer: dataUri + ' arrayBuffer'
    }))

    const document = {
      dataUri: 'dataUri content',
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
      log: jest.fn()
    })

    const fileDocument = {
      _type: 'io.cozy.files',
      type: 'file',
      data: 'dataUri content arrayBuffer',
      dirId: '/test/folder/path',
      name: 'file name.txt',
      sourceAccount: 'testsourceaccount',
      sourceAccountIdentifier: 'testsourceaccountidentifier',
      metadata: {
        fileIdAttributes: 'file name.txt'
      }
    }
    expect(client.save).toHaveBeenCalledWith({
      ...fileDocument,
      data: 'dataUri content arrayBuffer'
    })
    expect(result).toStrictEqual([
      {
        filename: 'file name.txt',
        fileDocument
      }
    ])
    expect(dataUriToArrayBuffer).toHaveBeenCalledWith('dataUri content')
  })
  it('should save a file with filestream without subPath', async () => {
    const client = {
      save: jest.fn().mockImplementation(doc => ({
        data: doc
      })),
      query: jest.fn().mockResolvedValue({ included: [], data: null }),
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
      log: jest.fn()
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
        filename: 'file name.txt',
        fileDocument
      }
    ])
  })
  it('should save a file with qualification label', async () => {
    const client = {
      save: jest.fn().mockImplementation(doc => ({
        data: doc
      })),
      query: jest.fn().mockResolvedValue({ included: [], data: null }),
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
      qualificationLabel: 'energy_invoice',
      log: jest.fn()
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
        filename: 'file name.txt',
        fileDocument
      }
    ])
  })
  it('should save a file with a subPath', async () => {
    const client = {
      save: jest.fn().mockImplementation(doc => ({
        data: doc
      })),
      query: jest.fn().mockResolvedValue({ included: [], data: null }),
      collection: () => ({
        statByPath: jest.fn().mockImplementation(path => {
          return { data: { _id: path } }
        }),
        ensureDirectoryExists: jest.fn().mockImplementation(async path => path)
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
      existingFilesIndex: new Map(),
      log: jest.fn()
    })
    expect(client.save).toHaveBeenCalledWith(
      expect.objectContaining({
        dirId: '/test/folder/path/subPath'
      })
    )
    expect(result).toStrictEqual([
      {
        filename: 'file name.txt',
        fileDocument: expect.objectContaining({
          dirId: '/test/folder/path/subPath'
        })
      }
    ])
  })
  it('should save a file with a subPath even if the subPath directory is removed after start', async () => {
    let index = 0
    const client = {
      save: jest.fn().mockImplementation(async doc => {
        if (doc.dirId === '/test/folder/path/subPath1') {
          const err = new Error('directory does not exist')
          err.response = { status: 404 }
          throw err
        }
        return { data: doc }
      }),
      query: jest.fn().mockResolvedValue({ included: [], data: null }),
      collection: () => ({
        statByPath: jest.fn().mockImplementation(path => {
          return { data: { _id: path } }
        }),
        ensureDirectoryExists: jest
          .fn()
          .mockImplementation(async path => path + index++)
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
      retry: 1,
      sourceAccount: 'testsourceaccount',
      sourceAccountIdentifier: 'testsourceaccountidentifier',
      fileIdAttributes: ['filename'],
      existingFilesIndex: new Map(),
      log: jest.fn()
    })
    expect(client.save).toHaveBeenCalledTimes(2)
    expect(client.save).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        dirId: '/test/folder/path/subPath1'
      })
    )
    expect(client.save).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        dirId: '/test/folder/path/subPath2'
      })
    )
    expect(result).toEqual([
      {
        filename: 'file name.txt',
        fileDocument: expect.objectContaining({
          dirId: '/test/folder/path/subPath2'
        })
      }
    ])
  })
  it('should send MAIN_FOLDER_REMOVED error when the main folder has been removed', async () => {
    const notExistingDirectoryErr = new Error('directory does not exist')
    notExistingDirectoryErr.response = { status: 404 }

    const client = {
      save: jest.fn().mockRejectedValueOnce(notExistingDirectoryErr),
      query: jest.fn().mockResolvedValue({ included: [], data: null }),
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
    await expect(
      saveFiles(client, [document], '/test/folder/path', {
        manifest: {
          slug: 'testslug'
        },
        retry: 1,
        sourceAccount: 'testsourceaccount',
        sourceAccountIdentifier: 'testsourceaccountidentifier',
        fileIdAttributes: ['filename'],
        existingFilesIndex: new Map(),
        log: jest.fn()
      })
    ).rejects.toThrow('MAIN_FOLDER_REMOVED')
  })

  it('should work even with an empty array of entries and no logger in options', async () => {
    const client = {
      save: jest.fn().mockImplementation(doc => ({
        data: doc
      })),
      query: jest.fn().mockResolvedValue({ included: [], data: null }),
      collection: () => ({
        statByPath: jest
          .fn()
          .mockImplementation(async path => ({ data: { _id: path } }))
      })
    }

    const downloadAndFormatFile = jest.fn().mockResolvedValue({
      dataUri: 'downloaded file content'
    })

    let caught = false
    try {
      await saveFiles(client, [], '/test/folder/path', {
        manifest: {
          slug: 'testslug'
        },
        sourceAccount: 'testsourceaccount',
        sourceAccountIdentifier: 'testsourceaccountidentifier',
        fileIdAttributes: ['filename'],
        existingFilesIndex: new Map(),
        downloadAndFormatFile
      })
    } catch (err) {
      caught = true
      // eslint-disable-next-line no-console
      console.error('err', err)
    }
    expect(caught).toBe(false)
  })
  it('should save a file with a contract', async () => {
    const ensureDirectoryExists = jest
      .fn()
      .mockImplementation(async path => path)
    const createDirectoryByPath = jest
      .fn()
      .mockImplementation(async path => ({ data: { path } }))
    const client = {
      save: jest.fn().mockImplementation(doc => ({
        data: doc
      })),
      query: jest.fn().mockResolvedValue({ included: [], data: null }),
      collection: () => ({
        statByPath: jest.fn().mockImplementation(path => {
          return { data: { _id: path } }
        }),
        ensureDirectoryExists,
        createDirectoryByPath,
        addReferencesTo: jest.fn()
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
      contract: {
        id: 'testContractId',
        name: 'testContractName'
      },
      sourceAccount: 'testsourceaccount',
      sourceAccountIdentifier: 'testsourceaccountidentifier',
      fileIdAttributes: ['filename'],
      existingFilesIndex: new Map(),
      log: jest.fn()
    })
    expect(createDirectoryByPath).toHaveBeenCalledWith(
      '/test/folder/path/testContractName'
    )
    expect(client.save).toHaveBeenCalledWith(
      expect.objectContaining({
        dirId: '/test/folder/path/testContractName'
      })
    )
    expect(result).toStrictEqual([
      {
        filename: 'file name.txt',
        fileDocument: expect.objectContaining({
          dirId: '/test/folder/path/testContractName'
        })
      }
    ])
  })
  it('should save only one file even with multiple entries related to the same file', async () => {
    const client = {
      save: jest.fn().mockImplementation(doc => ({
        data: doc
      })),
      query: jest.fn().mockResolvedValue({ included: [], data: null }),
      collection: () => ({
        statByPath: jest.fn().mockImplementation(path => {
          return { data: { _id: path } }
        }),
        addReferencesTo: jest.fn()
      })
    }
    const documents = [
      {
        filestream: 'filestream content',
        filename: 'file name.txt'
      },
      {
        filestream: 'filestream content 2',
        filename: 'file name.txt'
      }
    ]
    await saveFiles(client, documents, '/test/folder/path', {
      manifest: {
        slug: 'testslug'
      },
      sourceAccount: 'testsourceaccount',
      sourceAccountIdentifier: 'testsourceaccountidentifier',
      fileIdAttributes: ['filename'],
      existingFilesIndex: new Map(),
      log: jest.fn()
    })
    expect(client.save).toHaveBeenCalledTimes(1)
    expect(client.save).toHaveBeenNthCalledWith(1, {
      _type: 'io.cozy.files',
      data: 'filestream content',
      dirId: '/test/folder/path',
      metadata: {
        fileIdAttributes: 'file name.txt'
      },
      name: 'file name.txt',
      sourceAccount: 'testsourceaccount',
      sourceAccountIdentifier: 'testsourceaccountidentifier',
      type: 'file'
    })
  })
})
