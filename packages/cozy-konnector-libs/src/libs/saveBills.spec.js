const logger = require('cozy-logger')

const addData = require('./addData')
const hydrateAndFilter = require('./hydrateAndFilter')
const manifest = require('./manifest')
const saveBills = require('./saveBills')
const saveFiles = require('./saveFiles')

jest.mock('./saveFiles')
jest.mock('./hydrateAndFilter')
jest.mock('./addData')
const manageContractsData = saveBills.manageContractsData

const asyncResolve = val => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(val)
    }, 1)
  })
}

logger.setLevel('critical')

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

describe('manageContractsData', function () {
  it('Append contracts data if contractId present in options', async () => {
    let entries = [
      {
        filename: 'filename',
        fileurl: 'fileurl',
        amount: 12,
        date: new Date(),
        vendor: 'vendor'
      }
    ]
    let options = { contractId: 'contractId' }
    entries = manageContractsData(entries, options)
    expect(entries[0].contractId).toEqual('contractId')
    expect(entries[0].contractLabel).toEqual('contractId')
    expect(options.subPath).toEqual('contractId')
  })
  it('Append contracts data if contractId & contractLabel presents in options', async () => {
    let entries = [
      {
        filename: 'filename',
        fileurl: 'fileurl',
        amount: 12,
        date: new Date(),
        vendor: 'vendor'
      }
    ]
    let options = { contractId: 'contractId', contractLabel: 'contractLabel' }
    entries = manageContractsData(entries, options)
    expect(entries[0].contractId).toEqual('contractId')
    expect(entries[0].contractLabel).toEqual('contractLabel')
    expect(options.subPath).toEqual('contractLabel')
  })
  it('Append contracts data if contractId & contractLabel presents in bill attributes', async () => {
    let entries = [
      {
        filename: 'filename',
        fileurl: 'fileurl',
        amount: 12,
        date: new Date(),
        vendor: 'vendor',
        contractId: 'contractId1'
      },
      {
        filename: 'filename2',
        fileurl: 'fileurl2',
        amount: 13,
        date: new Date(),
        vendor: 'vendor',
        contractId: 'contractId2'
      }
    ]
    entries = manageContractsData(entries, {})
    expect(entries[0].contractId).toEqual('contractId1')
    expect(entries[0].contractLabel).toEqual('contractId1')
    expect(entries[0].subPath).toEqual('contractId1')
    expect(entries[1].contractId).toEqual('contractId2')
    expect(entries[1].contractLabel).toEqual('contractId2')
    expect(entries[1].subPath).toEqual('contractId2')
  })
  it('Append contracts data if contractId & contractLabel presents in bill attributes', async () => {
    let entries = [
      {
        filename: 'filename',
        fileurl: 'fileurl',
        amount: 12,
        date: new Date(),
        vendor: 'vendor',
        contractId: 'contractId1',
        contractLabel: 'contractLabel1'
      },
      {
        filename: 'filename2',
        fileurl: 'fileurl2',
        amount: 13,
        date: new Date(),
        vendor: 'vendor',
        contractId: 'contractId2',
        contractLabel: 'contractLabel2'
      }
    ]
    entries = manageContractsData(entries, {})
    expect(entries[0].contractId).toEqual('contractId1')
    expect(entries[0].contractLabel).toEqual('contractLabel1')
    expect(entries[0].subPath).toEqual('contractLabel1')
    expect(entries[1].contractId).toEqual('contractId2')
    expect(entries[1].contractLabel).toEqual('contractLabel2')
    expect(entries[1].subPath).toEqual('contractLabel2')
  })
  it('Check that deduplication keys contains contractId', async () => {
    let entries = [
      {
        filename: 'filename',
        fileurl: 'fileurl',
        amount: 12,
        date: new Date(),
        vendor: 'vendor',
        contractId: 'contractId1',
        contractLabel: 'contractLabel1'
      },
      {
        filename: 'filename2',
        fileurl: 'fileurl2',
        amount: 13,
        date: new Date(),
        vendor: 'vendor',
        contractId: 'contractId2',
        contractLabel: 'contractLabel2'
      }
    ]
    let options = { keys: [] }
    manageContractsData(entries, options)
    expect(options.keys.includes('contractId')).toEqual(true)
    expect(options.keys.filter(el => el === 'contractId').length).toEqual(1)
  })
})
