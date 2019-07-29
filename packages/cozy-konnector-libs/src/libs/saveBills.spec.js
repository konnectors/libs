jest.mock('./saveFiles')
jest.mock('./hydrateAndFilter')
jest.mock('./addData')
const addData = require('./addData')
const hydrateAndFilter = require('./hydrateAndFilter')
const saveFiles = require('./saveFiles')
const saveBills = require('./saveBills')
const manifest = require('./manifest')
const logger = require('cozy-logger')
const asyncResolve = val => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(val)
    }, 1)
  })
}

logger.setLevel('critical')

beforeEach(async function() {
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

describe('saveBills', function() {
  it('should check required attributes in bills', async () => {
    expect.assertions(1)
    try {
      await saveBills(
        [
          {
            filename: 'filename',
            fileurl: 'fileurl',
            amount: 'bad amount type',
            date: new Date(),
            vendor: 'vendor'
          }
        ],
        {
          linkBankOperations: false
        }
      )
    } catch (err) {
      expect(err.message).toEqual(
        'saveBills: an entry has a amount which does not respect isNumber'
      )
    }
  })
  it('should add label transaction regexp if found in the manifest', async () => {
    manifest.data = { banksTransactionRegExp: 'toto regexp' }
    const entry = {
      filename: 'filename',
      fileurl: 'fileurl',
      amount: 12,
      date: new Date(),
      vendor: 'vendor'
    }
    const result = await saveBills([entry], null, {
      linkBankOperations: false
    })

    expect(result).toEqual([
      {
        ...entry,
        matchingCriterias: { labelRegex: 'toto regexp' },
        currency: 'EUR',
        invoice: 'io.cozy.files:undefined'
      }
    ])
  })
})
