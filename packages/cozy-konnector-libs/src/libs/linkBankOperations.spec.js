import { Linker } from './linkBankOperations'

jest.mock('./cozyclient')
const cozyClient = require('./cozyclient')
const indexBy = require('lodash/keyBy')

let linker

beforeEach(function () {
  // We mock defineIndex/query so that fetchOperations returns the right operations
  const INDEX = 'index'
  cozyClient.data.defineIndex.mockReturnValue(Promise.resolve(INDEX))

  linker = new Linker(cozyClient)
  linker.updateAttributes = jest.fn().mockReturnValue(Promise.resolve())
})

const wrapAsFetchJSONResult = documents => {
  return {
    rows: documents.map(x => ({ id: x._id, doc: x}))
  }
}

describe('linker', () => {
  const bill = { amount: 110, _id: 'b1' }

  describe('addBillToOperation', () => {
    test('operation without bills', () => {
      const operation = { _id: 123456 }

      linker.addBillToOperation(bill, operation)

      expect(linker.updateAttributes).lastCalledWith(
        'io.cozy.bank.operations',
        operation, {
         bills: ['io.cozy.bills:b1']
        })
    })

    test('operation with bills', () => {
      const operation = { _id: 12345, bills: ['bill1'] }

      linker.addBillToOperation(bill, operation)

      expect(linker.updateAttributes).lastCalledWith(
        'io.cozy.bank.operations',
        operation, {
          bills: ['bill1', 'io.cozy.bills:b1']
        })
    })

    test('operation have already this bill', () => {
      const operation = { _id: 12345, bills: ['io.cozy.bills:b1'] }

      linker.addBillToOperation(bill, operation)

      expect(cozyClient.data.updateAttributes.mock.calls.length).toBe(0)
    })
  })

  describe('addReimbursementToOperation', () => {
    test('operation without reimbursements', () => {
      const operation = { _id: 123456 }

      linker.addReimbursementToOperation(bill, operation, operation)

      expect(linker.updateAttributes).lastCalledWith(
        'io.cozy.bank.operations',
        operation,
        {
          reimbursements: [{
            amount: 110,
            billId: 'io.cozy.bills:b1',
            operationId: 123456
          }]
        }
      )
    })

    test('operation with reimbursements', () => {
      const operation = { _id: 123456, reimbursements: ['test'] }

      linker.addReimbursementToOperation(bill, operation, operation)

      expect(linker.updateAttributes).lastCalledWith(
        'io.cozy.bank.operations',
        operation,
        {
          reimbursements: ['test', {
            amount: 110,
            billId: 'io.cozy.bills:b1',
            operationId: 123456
          }]
        }
      )
    })

    test('operation have already the reimbursement', () => {
      const operation = {
        _id: 123456,
        reimbursements: [{
          amount: 110,
          billId: 'io.cozy.bills:b1',
          operationId: 123456
        }]
      }

      linker.addReimbursementToOperation(bill, operation, operation)

      expect(cozyClient.data.updateAttributes.mock.calls.length).toBe(0)
    })
  })

  describe('linkBillsToOperations', () => {
    const operationsInit = [
      { amount: -20, label: 'Visite chez le médecin', _id: 'medecin', date: new Date(2017, 11, 13), automaticCategoryId: '400610' },
      { amount: 5, label: 'Remboursement CPAM', _id: 'cpam', date: new Date(2017, 11, 15), automaticCategoryId: '400610' },
      { amount: -120, label: 'Facture SFR', _id: 'big_sfr', date: new Date(2017, 11, 8) },
      { amount: -30, label: 'Facture SFR', _id: 'small_sfr', date: new Date(2017, 11, 7) },
      { amount: +30, label: "Remboursemet Matériel d'escalade", _id: 'escalade', date: new Date(2017, 11, 7) },
      { amount: -5.5, label: 'Burrito', _id: 'burrito', date: new Date(2017, 11, 5) },
      { amount: -2.6, label: 'Salade', _id: 'salade', date: new Date(2017, 11, 6) }
    ].map(x => ({ ...x, date: x.date.toISOString() }))

    let operations, operationsById

    beforeEach(function () {
      // reset operations to operationsInit values
      operations = operationsInit.map(op => ({ ...op }))
      operationsById = indexBy(operations, '_id')
      cozyClient.fetchJSON = jest.fn().mockReturnValue(Promise.resolve(wrapAsFetchJSONResult(operations)))
      linker.updateAttributes.mockImplementation(updateOperation)
    })

    const defaultOptions = {
      minAmountDelta: 1,
      maxAmountDelta: 1,
      pastWindow: 2,
      futureWindow: 2
    }

    function updateOperation (doctype, needleOp, attributes) {
      const operation = operations.find(operation => operation._id === needleOp._id)
      Object.assign(operation, attributes)
      return Promise.resolve(operation)
    }

    it('should match health bills correctly', () => {
      const healthBills = [
        {
          _id: 'b1',
          amount: 5,
          originalAmount: 20,
          type: 'health_costs',
          originalDate: new Date(2017, 11, 13),
          date: new Date(2017, 11, 15),
          isRefund: true,
          vendor: 'Ameli'
        }
      ]
      const options = { ...defaultOptions, identifiers: ['CPAM'] }
      return linker.linkBillsToOperations(healthBills, options)
      .then(result => {
        expect(result.b1.creditOperation).toEqual(operationsById.cpam)
        expect(result.b1.debitOperation).toEqual(operations[0])
        expect(operations[0]).toMatchObject({
          reimbursements: [{
            billId: 'io.cozy.bills:b1',
            amount: 5,
            operationId: 'cpam'
          }
        ]})
        expect(operationsById.cpam).toMatchObject({
          bills: ['io.cozy.bills:b1']
        })
      })
    })

    it('should match health bills with no debit operation with a credit operation', () => {
      const healthBills = [
        {
          _id: 'b1',
          amount: 5,
          originalAmount: 999,
          type: 'health_costs',
          originalDate: new Date(2017, 11, 13),
          date: new Date(2017, 11, 15),
          isRefund: true,
          vendor: 'Ameli'
        }
      ]
      const options = { ...defaultOptions, identifiers: ['CPAM'] }
      return linker.linkBillsToOperations(healthBills, options)
      .then(result => {
        expect(result).toMatchObject({
          b1: { creditOperation: operationsById.cpam }
        })
        expect(result.b1.debitOperation).toBe(undefined)
        expect(operationsById.cpam).toMatchObject({bills: ['io.cozy.bills:b1']})
      })
    })

    describe('health bill with group amount', () => {
      // Bills that have been reimbursed at the same date in the same
      // "bundle" have a "groupAmount" that is matched against
      // the debit operation
      const healthBills = [
        {
          _id: 'b1',
          amount: 3.5,
          groupAmount: 5,
          originalAmount: 20,
          type: 'health_costs',
          originalDate: new Date(2017, 11, 13),
          date: new Date(2017, 11, 15),
          isRefund: true,
          vendor: 'Ameli'
        },
        {
          _id: 'b2',
          amount: 1.5,
          groupAmount: 5,
          originalAmount: 20,
          type: 'health_costs',
          originalDate: new Date(2017, 11, 14),
          date: new Date(2017, 11, 16),
          isRefund: true,
          vendor: 'Ameli'
        }
      ]

      describe('with corresponding debit operation', () => {
        it('should be associated with the right operations', () => {
          const options = { ...defaultOptions, identifiers: ['CPAM'] }
          return linker.linkBillsToOperations(healthBills, options)
            .then(result => {
              const debitOperation = expect.any(Object)
              expect(result).toMatchObject({
                b1: { creditOperation: operationsById.cpam, debitOperation },
                b2: { creditOperation: operationsById.cpam, debitOperation }
              })
              expect(operationsById.cpam).toMatchObject({
                bills: ['io.cozy.bills:b1', 'io.cozy.bills:b2']
              })
              expect(result.b1.debitOperation).toBe(result.b2.debitOperation)
              expect(result.b1.debitOperation.reimbursements.length).toBe(2)
            })
        })
      })

      describe('without corresponding debit operation', () => {
        it('should be associated with the right credit operation', () => {
          const healthBills2 = healthBills.map(x => ({...x, originalAmount: 999}))
          const options = { ...defaultOptions, identifiers: ['CPAM'] }
          return linker.linkBillsToOperations(healthBills2, options)
            .then(result => {
              expect(result.b1.creditOperation).toBe(operationsById.cpam)
              expect(result.b2.creditOperation).toBe(operationsById.cpam)
              expect(result.b1.debitOperation).toBe(undefined)
              expect(result.b2.debitOperation).toBe(undefined)
              expect(operationsById.cpam).toMatchObject({
                bills: ['io.cozy.bills:b1', 'io.cozy.bills:b2']
              })
            })
        })
      })
    })


    it('not health bills', () => {
      const noHealthBills = [
        {
          _id: 'b2',
          amount: 30,
          date: new Date(2017, 11, 8),
          vendor: 'SFR'
        }
      ]
      const options = { ...defaultOptions, identifiers: ['SFR'] }
      return linker.linkBillsToOperations(noHealthBills, options)
      .then(result => {
        expect(result).toMatchObject({
          b2: { debitOperation: operationsById.small_sfr }
        })
      })
    })
  })

  describe('linking with combinations', () => {
    describe('getUnlinkedBills', () => {

      it('returns the bills that are not linked', () => {
        const linkingResult = {
          b1: { bill: { _id: 'b1' }, debitOperation: {} },
          b2: { bill: { _id: 'b2' } }
        }

        const expected = expect.arrayContaining([linkingResult.b2.bill])

        expect(linker.getUnlinkedBills(linkingResult)).toEqual(expected)
      })

      it('returns an empty array if all bills are linked', () => {
        const linkingResult = {
          b1: { bill: { _id: 'b1' }, debitOperation: {} },
          b2: { bill: { _id: 'b2' }, debitOperation: {} }
        }

        expect(linker.getUnlinkedBills(linkingResult)).toHaveLength(0)
      })
    })

    describe('groupBillsByOriginalDate', () => {
      const bills = [
        { _id: 'b1', originalDate: '2018-03-10T00:00:00Z' },
        { _id: 'b2', originalDate: '2018-03-10T00:00:00Z' },
        { _id: 'b3', originalDate: '2018-03-10T00:00:00Z' },
        { _id: 'b4', originalDate: '2018-03-15T00:00:00Z' },
        { _id: 'b5', originalDate: '2018-03-15T00:00:00Z' },
        { _id: 'b6', originalDate: '2018-03-20T00:00:00Z' },
        { _id: 'b7', originalDate: '2018-03-20T00:00:00Z' },
        { _id: 'b8', originalDate: '2018-03-20T00:00:00Z' },
        { _id: 'b9', originalDate: '2018-03-20T00:00:00Z' },
        { _id: 'b10', originalDate: '2018-03-30T00:00:00Z' }
      ]

      it('groups bills by their originalDate property', () => {
        const result = linker.groupBillsByOriginalDate(bills)

        expect(result['2018-03-10T00:00:00Z']).toHaveLength(3)
        expect(result['2018-03-15T00:00:00Z']).toHaveLength(2)
        expect(result['2018-03-20T00:00:00Z']).toHaveLength(4)
        expect(result['2018-03-30T00:00:00Z']).toHaveLength(1)
      })
    })

    describe('generateBillsCombinations', () => {
      const bills = [
        { _id: 'b1' },
        { _id: 'b2' },
        { _id: 'b3' },
        { _id: 'b4' }
      ]

      it('generates the right combinations', () => {
        const result = linker.generateBillsCombinations(bills)

        expect(result).toContainEqual([bills[0], bills[1]])
        expect(result).toContainEqual([bills[0], bills[2]])
        expect(result).toContainEqual([bills[0], bills[3]])
        expect(result).toContainEqual([bills[1], bills[2]])
        expect(result).toContainEqual([bills[1], bills[3]])
        expect(result).toContainEqual([bills[2], bills[3]])
        expect(result).toContainEqual([bills[0], bills[1], bills[2]])
        expect(result).toContainEqual([bills[0], bills[1], bills[3]])
        expect(result).toContainEqual([bills[0], bills[2], bills[3]])
        expect(result).toContainEqual([bills[1], bills[2], bills[3]])
        expect(result).toContainEqual([bills[0], bills[1], bills[2], bills[3]])
      })
    })

    describe('combineBills', () => {
      const bills = [
        {
          _id: 'b1',
          amount: 10,
          originalAmount: 20,
          originalDate: '2018-03-10T00:00:00Z'
        },
        {
          _id: 'b2',
          amount: 10,
          originalAmount: 10,
          originalDate: '2018-03-10T00:00:00Z'
        }
      ]

      it('generate a bill with the right amount', () => {
        const combinedBill = linker.combineBills(...bills)
        expect(combinedBill.amount).toBe(20)
      })

      it('generates a bill with the right originalAmount', () => {
        const combinedBill = linker.combineBills(...bills)
        expect(combinedBill.originalAmount).toBe(30)
      })

      it('generates a bill with the right originalDate', () => {
        const combinedBill = linker.combineBills(...bills)
        expect(combinedBill.originalDate).toBe('2018-03-10T00:00:00Z')
      })
    })
  })
})
