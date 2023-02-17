import addData from './addData'
import hydrateAndFilter from './hydrateAndFilter'
import saveFiles from './saveFiles'
import saveBills from './saveBills'
import logger from 'cozy-logger'
jest.mock('./saveFiles')
jest.mock('./hydrateAndFilter')
jest.mock('./addData')
const asyncResolve = val => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(val)
    }, 1)
  })
}

// logger.setLevel('critical')

beforeEach(async function () {
  saveFiles.mockImplementation(entries => {
    return asyncResolve(entries.map(doc => ({ ...doc, fileDocument: true })))
  })
  hydrateAndFilter.mockImplementation(entries => {
    return asyncResolve(entries)
  })
  addData.mockImplementation(entries => {
    return asyncResolve(entries)
  })
})

describe('saveBills', function () {
  it('should check amount in bills', async () => {
    expect.assertions(1)
    await expect(async () => {
      return saveBills(
        [
          {
            filename: 'filename',
            fileurl: 'fileurl',
            amount: 'bad amount type',
            date: new Date(),
            vendor: 'vendor',
            fileDocument: {_id: 'testfileid'}
          }
        ],
        {
          linkBankOperations: false
        }
      )
    }).rejects.toThrow('saveBills: an entry has a amount which does not respect isNumber')
  })
  it('should check dates in bills', async () => {
    expect.assertions(1)
    await expect(async () => {
      return saveBills(
        [
          {
            filename: 'filename',
            fileurl: 'fileurl',
            amount: 12,
            date: 'nodate',
            vendor: 'vendor',
            fileDocument: {_id: 'testfileid'}
          }
        ],
        {
          linkBankOperations: false
        }
      )
    }).rejects.toThrow('saveBills: an entry has a date which does not respect isDate')
  })
})

