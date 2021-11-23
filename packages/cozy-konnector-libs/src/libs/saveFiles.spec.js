jest.mock('./cozyclient')
const cozyClient = require('./cozyclient')
const manifest = require('./manifest')
jest.mock('./utils')
const { queryAll } = require('./utils')
jest.mock('./mkdirp')
const mkdirp = require('./mkdirp')
const logger = require('cozy-logger')
const saveFiles = require('./saveFiles')
const getFileIfExists = saveFiles.getFileIfExists
const asyncResolve = val => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(val)
    }, 1)
  })
}
const asyncReject = val => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(val)
    }, 1)
  })
}

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

beforeEach(async function() {
  const INDEX = 'index'
  bills = getBillFixtures()
  cozyClient.data.defineIndex.mockReturnValue(() => asyncResolve(INDEX))
  cozyClient.files.create.mockReset()
  cozyClient.files.updateById.mockReset()
  cozyClient.files.statByPath.mockReset()
  cozyClient.files.create.mockImplementation((rqPromise, options) => {
    return { _id: 'newFileId', attributes: { ...options } }
  })
  cozyClient.files.updateById.mockImplementation(
    (fileId, rqPromise, options) => {
      return { _id: fileId, attributes: { ...options } }
    }
  )
})

describe('saveFiles', function() {
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
        cozyClient.files.statByPath.mockImplementation(path => {
          // Must check if we are stating on the folder or on the file
          return path === FOLDER_PATH
            ? asyncResolve({ _id: 'folderId' })
            : asyncResolve(existingFile)
        })
        await saveFiles(bills, options)
      })

      // Whether a file should be created or not
      it(`should${
        expectCreation ? ' ' : ' not '
      }create a file`, async function() {
        if (expectCreation) {
          expect(cozyClient.files.create).toHaveBeenCalledTimes(bills.length)
        } else {
          expect(cozyClient.files.create).not.toHaveBeenCalled()
        }
      })

      // Whether a file should be updated or not
      if (expectUpdate) {
        it(`should${
          expectUpdate ? ' ' : ' not '
        }update a file`, async function() {
          if (expectUpdate) {
            expect(cozyClient.files.updateById).toHaveBeenCalledTimes(
              bills.length
            )
          } else {
            expect(cozyClient.files.updateById).not.toHaveBeenCalled()
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
  // describe('when entry have shouldReplaceName', () => {
  //   beforeEach(async () => {
  //     cozyClient.files.statByPath.mockImplementation(() => {
  //       return asyncResolve({ _id: 'folderId' })
  //     })
  //     queryAll.mockImplementation(() => {
  //       // Watch out, not the same format as cozyClient.files
  //       return [{ name: '201712_freemobile.pdf', _id: 'idToRename' }]
  //     })
  //     cozyClient.files.updateAttributesById.mockReset()
  //     cozyClient.files.updateAttributesById.mockImplementation(() => {
  //       return
  //     })
  //   })
  //   const billWithShouldReplaceName = [
  //     {
  //       amount: 20.09,
  //       date: '2017-12-12T23:00:00.000Z',
  //       vendor: 'Free Mobile',
  //       type: 'phone',
  //       fileurl:
  //         'https://mobile.free.fr/moncompte/index.php?page=suiviconso&action=getFacture&format=dl&l=14730097&id=7c7dfbfc8707b75fb478f68a50b42fc6&date=20171213&multi=0',
  //       filename: '201712_freemobile_nicename.pdf',
  //       shouldReplaceName: '201712_freemobile.pdf'
  //     }
  //   ]

  //   it('should replace filename', async () => {
  //     await saveFiles(billWithShouldReplaceName, options)
  //     expect(cozyClient.files.create).not.toHaveBeenCalled()
  //     expect(cozyClient.files.updateAttributesById).toHaveBeenCalled()
  //   })
  // })

  const billWithoutFilename = [
    {
      amount: 62.93,
      date: '2018-03-03T23:00:00.000Z',
      vendor: 'Free Mobile',
      type: 'phone',
      filestream: 'mock stream'
    }
  ]
  describe('when filestream is used without filename', () => {
    it('should ignore the entry', async () => {
      const result = await saveFiles(billWithoutFilename, options)
      expect(result.length).toEqual(0)
      expect(cozyClient.files.create).not.toHaveBeenCalled()
    })
  })

  const billWithoutStreamUrlAndRequestOptions = [
    {
      amount: 62.93,
      date: '2018-03-03T23:00:00.000Z',
      vendor: 'Free Mobile',
      type: 'phone'
    }
  ]
  describe("when entry doesn't have file creation information", () => {
    it('should do nothing', async () => {
      expect.assertions(1)
      await saveFiles(billWithoutStreamUrlAndRequestOptions, options)
      expect(cozyClient.files.create).not.toHaveBeenCalled()
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
      expect(cozyClient.files.create).not.toHaveBeenCalled()
    })
  })

  describe('when new carbonCopy metadata available in entry', () => {
    it('should update the file', async () => {
      expect.assertions(2)
      cozyClient.files.statByPath.mockImplementation(path => {
        // Must check if we are stating on the folder or on the file
        return path === FOLDER_PATH
          ? asyncResolve({ _id: 'folderId' })
          : asyncResolve(
              makeFile('existingFileId', {
                name: 'bill.pdf'
              })
            )
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
      expect(cozyClient.files.create).not.toHaveBeenCalled()
      expect(cozyClient.files.updateById).toHaveBeenCalled()
    })
  })

  describe('when new qualification V2 is available', () => {
    it('should update the file', async () => {
      expect.assertions(2)
      cozyClient.files.statByPath.mockImplementation(path => {
        // Must check if we are stating on the folder or on the file
        return path === FOLDER_PATH
          ? asyncResolve({ _id: 'folderId' })
          : asyncResolve(
              makeFile('existingFileId', {
                name: 'bill.pdf',
                metadata: {
                  carbonCopy: true
                }
              })
            )
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
      expect(cozyClient.files.create).not.toHaveBeenCalled()
      expect(cozyClient.files.updateById).toHaveBeenCalled()
    })
  })
})

describe('subPath handling', () => {
  beforeEach(function() {
    mkdirp.mockReset()
    cozyClient.files.statByPath.mockImplementation(async path => {
      if (path.includes('randomfileurl.txt')) {
        return asyncReject({})
      } else {
        return asyncResolve({ _id: path })
      }
    })
  })
  it('should not create subPath if no subPath specified', async () => {
    await saveFiles([{ fileurl: 'randomfileurl.txt' }], {
      folderPath: 'mainPath'
    })

    expect(mkdirp.mock.calls.length).toBe(0)
    expect(cozyClient.files.create).toHaveBeenCalledTimes(1)
    expect(cozyClient.files.create.mock.calls[0][1]).toMatchObject({
      name: 'randomfileurl.txt',
      dirID: 'mainPath'
    })
  })
  it('should change the folderPath for entries with subPath', async () => {
    await saveFiles([{ fileurl: 'randomfileurl.txt', subPath: 'mySubPath' }], {
      folderPath: 'mainPath'
    })

    expect(mkdirp.mock.calls.length).toBe(1)
    expect(mkdirp.mock.calls[0][0]).toBe('mainPath/mySubPath')
    expect(cozyClient.files.create).toHaveBeenCalledTimes(1)
    expect(cozyClient.files.create.mock.calls[0][1]).toMatchObject({
      name: 'randomfileurl.txt',
      dirID: 'mainPath/mySubPath'
    })
  })
  it('should change the folderPath with subPath main option', async () => {
    await saveFiles(
      [{ fileurl: 'randomfileurl.txt' }],
      {
        folderPath: 'mainPath'
      },
      { subPath: 'mySubPath' }
    )

    expect(mkdirp.mock.calls.length).toBe(1)
    expect(mkdirp.mock.calls[0][0]).toBe('mainPath/mySubPath')
    expect(cozyClient.files.create).toHaveBeenCalledTimes(1)
    expect(cozyClient.files.create.mock.calls[0][1]).toMatchObject({
      name: 'randomfileurl.txt',
      dirID: 'mainPath/mySubPath'
    })
  })
})

describe('getFileIfExists', function() {
  describe('when in filepath mode', () => {
    beforeEach(function() {
      manifest.data.slug = false
      cozyClient.files.statByPath.mockReset()
    })
    it('when the file does not exist, should not return any file', async () => {
      cozyClient.files.statByPath.mockReturnValue(asyncReject(false))
      const result = await getFileIfExists(
        { filename: 'testfile.txt' },
        { folderPath: '/test/path' }
      )
      expect(result).toBe(false)
    })
    it('when the file exists and without metadata, should return the file', async () => {
      cozyClient.files.statByPath.mockReturnValue(
        asyncResolve({ name: 'testfile.txt' })
      )
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
    beforeEach(function() {
      manifest.data.slug = 'testconnector'
      cozyClient.data.defineIndex.mockReturnValue(asyncResolve('index'))
      cozyClient.files.statByPath.mockReset()
      queryAll.mockReset()
    })
    it('when the file does not exist, should not return any file', async () => {
      queryAll.mockReturnValue(asyncResolve([]))
      cozyClient.files.statByPath.mockReturnValue(asyncReject(false))
      const result = await getFileIfExists(
        { filename: 'testfile.txt', vendorRef: 'uniquevendorref' },
        options
      )
      expect(queryAll).lastCalledWith(
        'io.cozy.files',
        {
          metadata: {
            fileIdAttributes: 'uniquevendorref'
          },
          trashed: false,
          cozyMetadata: {
            sourceAccountIdentifier: 'accountidentifier',
            createdByApp: 'testconnector'
          }
        },
        'index'
      )
      expect(cozyClient.files.statByPath).lastCalledWith(
        '/test/path/testfile.txt'
      )
      expect(result).toBe(false)
    })
    it('when the file exists, should return the file', async () => {
      queryAll.mockReturnValue(asyncResolve([{ filename: 'coucou.txt' }]))
      const result = await getFileIfExists(
        { filename: 'testfile.txt', vendorRef: 'uniquevendorref' },
        options
      )
      expect(queryAll).lastCalledWith(
        'io.cozy.files',
        {
          metadata: {
            fileIdAttributes: 'uniquevendorref'
          },
          trashed: false,
          cozyMetadata: {
            sourceAccountIdentifier: 'accountidentifier',
            createdByApp: 'testconnector'
          }
        },
        'index'
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
        queryAll.mockReturnValue(asyncResolve([{ filename: 'coucou.txt' }]))
        const result = await getFileIfExists(
          {
            filename: 'testfile.txt',
            vendorRef: 'uniquevendorref',
            amount: 42
          },
          options
        )
        expect(queryAll).lastCalledWith(
          'io.cozy.files',
          {
            metadata: {
              fileIdAttributes: '42####uniquevendorref'
            },
            trashed: false,
            cozyMetadata: {
              sourceAccountIdentifier: 'accountidentifier',
              createdByApp: 'testconnector'
            }
          },
          'index'
        )
        expect(result).toEqual({ filename: 'coucou.txt' })
      })
    })
  })
})
