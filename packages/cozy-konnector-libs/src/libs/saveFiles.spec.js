jest.mock('./cozyclient')
const cozyClient = require('./cozyclient')
const save = jest.fn()
const destroy = jest.fn()
const queryAll = jest.fn()
const statByPath = jest.fn()
const deleteFilePermanently = jest.fn()
const fetchFileContentById = jest.fn()
const createDirectoryByPath = jest.fn()
cozyClient.new = {
  save,
  destroy,
  queryAll,
  collection: () => ({
    statByPath,
    deleteFilePermanently,
    fetchFileContentById,
    createDirectoryByPath
  })
}
const client = cozyClient.new

const manifest = require('./manifest')
const logger = require('cozy-logger')
const saveFiles = require('./saveFiles')
const getFileIfExists = saveFiles.getFileIfExists
const sanitizeFileName = saveFiles.sanitizeFileName

logger.setLevel('critical')

// TODO put in fixture file
function getBillFixtures() {
  return [
    {
      amount: 20.09,
      date: '2017-12-12T23:00:00.000Z',
      vendor: 'Free Mobile',
      type: 'phone',
      fileurl:
        'https://mobile.free.fr/moncompte/index.php?page=suiviconso&action=getFacture&format=dl&l=14730097&id=7c7dfbfc8707b75fb478f68a50b42fc6&date=20171213&multi=0',
      filename: '201712_freemobile.pdf'
    },
    {
      amount: 20.03,
      date: '2018-01-12T23:00:00.000Z',
      vendor: 'Free Mobile',
      type: 'phone',
      fileurl:
        'https://mobile.free.fr/moncompte/index.php?page=suiviconso&action=getFacture&format=dl&l=14730097&id=29654a01acee829ccf09596cf856ac1d&date=20180113&multi=0',
      filename: '201801_freemobile.pdf'
    },
    {
      amount: 20.39,
      date: '2017-01-12T23:00:00.000Z',
      vendor: 'Free Mobile',
      type: 'phone',
      fileurl:
        'https://mobile.free.fr/moncompte/index.php?page=suiviconso&action=getFacture&format=dl&l=14730097&id=0ca5e5537786bc548a87a89eba2a804a&date=20170113&multi=0',
      filename: '201701_freemobile.pdf'
    },
    {
      amount: 49.32,
      date: '2018-03-03T23:00:00.000Z',
      vendor: 'Free Mobile',
      type: 'phone',
      filestream: 'mock stream',
      filename: '201701_freemobile.pdf'
    }
  ]
}

const FOLDER_PATH = '/testfolder'
const options = { folderPath: FOLDER_PATH }
let bills

beforeEach(async function () {
  jest.clearAllMocks()
  bills = getBillFixtures()
  save.mockImplementation(async doc => {
    if (doc._id) {
      return { data: doc }
    } else {
      return { data: { ...doc, _id: 'newFileId' } }
    }
  })
})

describe('saveFiles', function () {
  const makeFile = (_id, attributes) => ({ _id, attributes })
  const rightMimeFile = makeFile('existingFileId', {
    name: '201701_freemobile.pdf',
    mime: 'application/pdf'
  })
  const badMimeFile = makeFile('existingFileId', {
    name: '201701_freemobile.pdf',
    mime: 'image/png'
  })

  // Definition of the tests
  const tests = [
    {
      name: 'when file does not exist',
      existingFile: null,
      expectCreation: true,
      expectUpdate: false,
      expectedBillFileId: 'newFileId'
    },
    {
      name: 'when file exists and mime is correct',
      existingFile: rightMimeFile,
      expectCreation: false,
      expectUpdate: false,
      expectedBillFileId: 'existingFileId'
    },
    {
      name: 'when file exists and mime is not correct',
      existingFile: badMimeFile,
      expectCreation: false,
      expectUpdate: true,
      expectedBillFileId: 'existingFileId'
    }
  ]

  // Creation of the tests
  for (let test of tests) {
    const {
      name,
      expectCreation,
      expectUpdate,
      expectedBillFileId,
      existingFile
    } = test
    describe(name, () => {
      beforeEach(async () => {
        statByPath.mockImplementation(async path => {
          if (path === FOLDER_PATH) {
            return { data: { _id: 'folderId' } }
          } else if (existingFile === null) {
            throw new Error('anything')
          } else {
            return { data: existingFile }
          }
        })
        await saveFiles(bills, options)
      })

      // Whether a file should be created or not
      it(`should${
        expectCreation ? ' ' : ' not '
      }create a file`, async function () {
        if (expectCreation) {
          expect(client.save).toHaveBeenCalledTimes(bills.length)
        }
      })

      // Whether a file should be updated or not
      if (expectUpdate) {
        it(`should${
          expectUpdate ? ' ' : ' not '
        }update a file`, async function () {
          if (expectUpdate) {
            expect(client.save).toHaveBeenCalledTimes(bills.length)
          } else {
            expect(client.save).not.toHaveBeenCalled()
          }
        })
      }

      // File should be included in doc (useful for bills to set the invoice)
      it('should store file in doc', () => {
        const bill = bills[0]
        expect(bill.fileDocument).not.toBe(undefined)
        expect(bill.fileDocument._id).toBe(expectedBillFileId)
      })

      // Bill shouldn't have sanitized attributes
      it('should have been sanitized', () => {
        expect.assertions(2 * bills.length)
        bills.map(bill => {
          expect(bill.requestOptions).toBeUndefined()
          expect(bill.filestream).toBeUndefined()
        })
      })
    })
  }

  // Renaming Test, not working due to not sucessfully mock updateAttributesById
  describe('when entry have shouldReplaceName', () => {
    beforeEach(async () => {
      /* cozyClient.files.statByPath.mockImplementation(() => {
         return asyncResolve({ _id: 'folderId' })
       })*/
      queryAll.mockImplementation(() => {
        // Watch out, not the same format as cozyClient.files
        return [{ name: '201712_freemobile.pdf', _id: 'idToRename' }]
      })
      /* cozyClient.files.updateAttributesById.mockReset()
       cozyClient.files.updateAttributesById.mockImplementation(() => {
         return
       })*/
    })
    const billWithShouldReplaceName = [
      {
        amount: 20.09,
        date: '2017-12-12T23:00:00.000Z',
        vendor: 'Free Mobile',
        type: 'phone',
        fileurl:
          'https://mobile.free.fr/moncompte/index.php?page=suiviconso&action=getFacture&format=dl&l=14730097&id=7c7dfbfc8707b75fb478f68a50b42fc6&date=20171213&multi=0',
        filename: '201712_freemobile_nicename.pdf',
        shouldReplaceName: '201712_freemobile.pdf'
      }
    ]

    it('should replace filename', async () => {
      await saveFiles(billWithShouldReplaceName, options)
      expect(client.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '201712_freemobile_nicename.pdf'
        })
      )
    })
  })

  describe('when filestream is used without filename', () => {
    it('should ignore the entry', async () => {
      const billWithoutFilename = [
        {
          amount: 62.93,
          date: '2018-03-03T23:00:00.000Z',
          vendor: 'Free Mobile',
          type: 'phone',
          filestream: 'mock stream'
        }
      ]
      const result = await saveFiles(billWithoutFilename, options)
      expect(result.length).toEqual(0)
      expect(client.save).not.toHaveBeenCalled()
    })
  })

  describe("when entry doesn't have file creation information", () => {
    it('should do nothing', async () => {
      const billWithoutStreamUrlAndRequestOptions = [
        {
          amount: 62.93,
          date: '2018-03-03T23:00:00.000Z',
          vendor: 'Free Mobile',
          type: 'phone'
        }
      ]
      expect.assertions(1)
      await saveFiles(billWithoutStreamUrlAndRequestOptions, options)
      expect(client.save).not.toHaveBeenCalled()
    })
  })

  describe('when timeout is reached', () => {
    it('should do nothing', async () => {
      expect.assertions(1)
      await saveFiles(
        [
          {
            amount: 62.93,
            fileurl: 'https://coucou.com/filetodownload.pdf',
            filename: 'bill.pdf',
            date: '2018-03-03T23:00:00.000Z',
            vendor: 'coucou'
          }
        ],
        options,
        { timeout: 1 }
      )
      expect(client.save).not.toHaveBeenCalled()
    })
  })

  describe('when new carbonCopy metadata available in entry', () => {
    it('should update the file', async () => {
      expect.assertions(1)
      statByPath.mockImplementation(async path => {
        // Must check if we are stating on the folder or on the file
        return path === FOLDER_PATH
          ? { data: { _id: 'folderId' } }
          : {
              data: makeFile('existingFileId', {
                name: 'bill.pdf'
              })
            }
      })
      await saveFiles(
        [
          {
            fileurl: 'https://coucou.com/filetodownload.pdf',
            filename: 'bill.pdf',
            fileAttributes: {
              metadata: {
                carbonCopy: true
              }
            }
          }
        ],
        {
          folderPath: 'mainPath'
        }
      )

      expect(client.save).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            carbonCopy: true
          }
        })
      )
    })
  })

  describe('when new qualification V2 is available', () => {
    it('should update the file', async () => {
      expect.assertions(1)
      statByPath.mockImplementation(async path => {
        // Must check if we are stating on the folder or on the file
        return path === FOLDER_PATH
          ? { data: { _id: 'folderId' } }
          : {
              data: makeFile('existingFileId', {
                name: 'bill.pdf',
                metadata: {
                  carbonCopy: true
                }
              })
            }
      })

      await saveFiles(
        [
          {
            fileurl: 'https://coucou.com/filetodownload.pdf',
            filename: 'bill.pdf',
            fileAttributes: {
              metadata: {
                carbonCopy: true,
                qualification: {
                  item1: true,
                  item2: 'toto'
                }
              }
            }
          }
        ],
        {
          folderPath: 'mainPath'
        }
      )
      expect(client.save).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            carbonCopy: true,
            qualification: {
              item1: true,
              item2: 'toto'
            }
          }
        })
      )
    })
  })

  describe('when a qualification V2 needs to be replaced', () => {
    it('should update the file', async () => {
      expect.assertions(1)
      statByPath.mockImplementation(async path => {
        // Must check if we are stating on the folder or on the file
        return path === FOLDER_PATH
          ? { data: { _id: 'folderId' } }
          : {
              data: makeFile('existingFileId', {
                name: 'bill.pdf',
                metadata: {
                  qualification: {
                    item1: true,
                    item2: 'toto'
                  }
                }
              })
            }
      })

      await saveFiles(
        [
          {
            fileurl: 'https://coucou.com/filetodownload.pdf',
            filename: 'bill.pdf',
            fileAttributes: {
              metadata: {
                qualification: {
                  item1: true,
                  item2: 'tata'
                }
              }
            }
          }
        ],
        {
          folderPath: 'mainPath'
        }
      )
      expect(client.save).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            qualification: {
              item1: true,
              item2: 'tata'
            }
          }
        })
      )
    })
  })

  describe('when a qualification V2 do not need to be updated', () => {
    it('should not update the file', async () => {
      expect.assertions(1)
      statByPath.mockImplementation(async path => {
        // Must check if we are stating on the folder or on the file
        return path === FOLDER_PATH
          ? { data: { _id: 'folderId' } }
          : {
              data: makeFile('existingFileId', {
                name: 'bill.pdf',
                metadata: {
                  qualification: {
                    item1: true,
                    item2: 'tata'
                  }
                }
              })
            }
      })

      await saveFiles(
        [
          {
            fileurl: 'https://coucou.com/filetodownload.pdf',
            filename: 'bill.pdf',
            fileAttributes: {
              metadata: {
                qualification: {
                  item1: true,
                  item2: 'tata'
                }
              }
            }
          }
        ],
        {
          folderPath: 'mainPath'
        }
      )
      expect(client.save).not.toHaveBeenCalled()
    })
  })
})

describe('subPath handling', () => {
  beforeEach(function () {
    statByPath.mockImplementation(async path => {
      if (path.includes('randomfileurl.txt')) {
        throw new Error('Anything')
      } else {
        return { data: { _id: path } }
      }
    })
  })
  it('should not create subPath if no subPath specified', async () => {
    await saveFiles([{ fileurl: 'randomfileurl.txt' }], {
      folderPath: 'mainPath'
    })

    expect(client.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'randomfileurl.txt',
        dirId: 'mainPath'
      })
    )
    expect(client.collection().createDirectoryByPath.mock.calls.length).toBe(0)
  })
  it('should change the folderPath for entries with subPath', async () => {
    await saveFiles([{ fileurl: 'randomfileurl.txt', subPath: 'mySubPath' }], {
      folderPath: 'mainPath'
    })

    expect(client.collection().createDirectoryByPath).toHaveBeenCalledWith(
      'mainPath/mySubPath'
    )

    expect(client.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'randomfileurl.txt',
        dirId: 'mainPath/mySubPath'
      })
    )
  })
  it('should change the folderPath with subPath main option', async () => {
    await saveFiles(
      [{ fileurl: 'randomfileurl.txt' }],
      {
        folderPath: 'mainPath'
      },
      { subPath: 'mySubPath' }
    )

    expect(client.collection().createDirectoryByPath).toHaveBeenCalledWith(
      'mainPath/mySubPath'
    )

    expect(client.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'randomfileurl.txt',
        dirId: 'mainPath/mySubPath'
      })
    )
  })
})

describe('getFileIfExists', function () {
  jest.resetAllMocks()
  statByPath.mockReset()
  describe('when in filepath mode', () => {
    beforeEach(function () {
      manifest.data.slug = false // Without slug, force filepath mode
    })
    it('when the file does not exist, should not return any file', async () => {
      statByPath.mockRejectedValue('anErroredPromise')
      const result = await getFileIfExists(
        { filename: 'testfile.txt' },
        { folderPath: '/failing/test/path' }
      )
      expect(result).toBe(false)
    })
    it('when the file exists and without metadata, should return the file', async () => {
      statByPath.mockResolvedValue({ data: { name: 'testfile.txt' } })
      const result = await getFileIfExists(
        { filename: 'testfile.txt' },
        { folderPath: '/test/path' }
      )
      expect(result).toEqual({ name: 'testfile.txt' })
    })
  })
  describe('when in metadata mode', () => {
    const options = {
      fileIdAttributes: ['vendorRef'],
      sourceAccountOptions: {
        sourceAccountIdentifier: 'accountidentifier'
      },
      folderPath: '/test/path'
    }
    beforeEach(function () {
      manifest.data.slug = 'testconnector'
      queryAll.mockReset()
    })
    it('when the file does not exist, should not return any file', async () => {
      queryAll.mockResolvedValue([])
      statByPath.mockRejectedValue('anErroredPromise')
      const result = await getFileIfExists(
        { filename: 'testfile.txt', vendorRef: 'uniquevendorref' },
        options
      )
      expect(statByPath).lastCalledWith('/test/path/testfile.txt')
      expect(result).toBe(false)
    })
    it('when the file exists, should return the file', async () => {
      queryAll.mockResolvedValue([{ filename: 'coucou.txt' }])
      const result = await getFileIfExists(
        { filename: 'testfile.txt', vendorRef: 'uniquevendorref' },
        options
      )
      expect(result).toEqual({ filename: 'coucou.txt' })
    })

    describe('when multiple fileIdAttributes are given', () => {
      const options = {
        fileIdAttributes: ['vendorRef', 'amount'],
        sourceAccountOptions: {
          sourceAccountIdentifier: 'accountidentifier'
        },
        folderPath: '/test/path'
      }
      it('when the file exists, should return the file', async () => {
        queryAll.mockResolvedValue([{ filename: 'coucou.txt' }])
        const result = await getFileIfExists(
          {
            filename: 'testfile.txt',
            vendorRef: 'uniquevendorref',
            amount: 42
          },
          options
        )
        expect(result).toEqual({ filename: 'coucou.txt' })
      })
    })
  })
})

describe('filename sanitization', () => {
  it('should sanitize control characters', async () => {
    const stg1 = 'AAA\x00BBB\x0ACCC.pdf'
    expect(sanitizeFileName(stg1)).toEqual('AAABBBCCC.pdf')
    const stg2 = '\x0FAAA'
    expect(sanitizeFileName(stg2)).toEqual('AAA')
  })
})
