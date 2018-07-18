import { Linker } from './linkBankOperations'

jest.mock('./cozyclient')
jest.mock('cozy-logger', () => ({
  namespace: () => () => ({})
}))
const cozyClient = require('./cozyclient')
const indexBy = require('lodash/keyBy')

let linker

beforeEach(function() {
  // We mock defineIndex/query so that fetchOperations returns the right operations
  const INDEX = 'index'
  cozyClient.data.defineIndex.mockReturnValue(Promise.resolve(INDEX))

  linker = new Linker(cozyClient)
  linker.updateAttributes = jest.fn().mockReturnValue(Promise.resolve())
})

const wrapAsFetchJSONResult = documents => {
  return {
    rows: documents.map(x => ({ id: x._id, doc: x }))
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
        operation,
        {
          bills: ['io.cozy.bills:b1']
        }
      )
    })

    test('operation with bills', () => {
      const operation = { _id: 12345, bills: ['bill1'] }

      linker.addBillToOperation(bill, operation)

      expect(linker.updateAttributes).lastCalledWith(
        'io.cozy.bank.operations',
        operation,
        {
          bills: ['bill1', 'io.cozy.bills:b1']
        }
      )
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
          reimbursements: [
            {
              amount: 110,
              billId: 'io.cozy.bills:b1',
              operationId: 123456
            }
          ]
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
          reimbursements: [
            'test',
            {
              amount: 110,
              billId: 'io.cozy.bills:b1',
              operationId: 123456
            }
          ]
        }
      )
    })

    test('operation have already the reimbursement', () => {
      const operation = {
        _id: 123456,
        reimbursements: [
          {
            amount: 110,
            billId: 'io.cozy.bills:b1',
            operationId: 123456
          }
        ]
      }

      linker.addReimbursementToOperation(bill, operation, operation)

      expect(cozyClient.data.updateAttributes.mock.calls.length).toBe(0)
    })
  })

  describe('linkBillsToOperations', () => {
    const operationsInit = [
      {
        amount: -20,
        label: 'Visite chez le médecin',
        _id: 'medecin',
        date: new Date(2017, 11, 13),
        automaticCategoryId: '400610'
      },
      {
        amount: 5,
        label: 'Remboursement CPAM',
        _id: 'cpam',
        date: new Date(2017, 11, 15),
        automaticCategoryId: '400610'
      },
      {
        amount: -120,
        label: 'Facture SFR',
        _id: 'big_sfr',
        date: new Date(2017, 11, 8)
      },
      {
        amount: -30,
        label: 'Facture SFR',
        _id: 'small_sfr',
        date: new Date(2017, 11, 7)
      },
      {
        amount: +30,
        label: "Remboursemet Matériel d'escalade",
        _id: 'escalade',
        date: new Date(2017, 11, 7)
      },
      {
        amount: -5.5,
        label: 'Burrito',
        _id: 'burrito',
        date: new Date(2017, 11, 5)
      },
      {
        amount: -2.6,
        label: 'Salade',
        _id: 'salade',
        date: new Date(2017, 11, 6)
      }
    ].map(x => ({ ...x, date: x.date.toISOString() }))

    let operations, operationsById

    beforeEach(function() {
      // reset operations to operationsInit values
      operations = operationsInit.map(op => ({ ...op }))
      operationsById = indexBy(operations, '_id')
      cozyClient.fetchJSON = jest
        .fn()
        .mockImplementation(() =>
          Promise.resolve(wrapAsFetchJSONResult(operations))
        )
      linker.updateAttributes.mockImplementation(updateOperation)
    })

    const defaultOptions = {
      minAmountDelta: 1,
      maxAmountDelta: 1,
      pastWindow: 2,
      futureWindow: 2
    }

    function updateOperation(doctype, needleOp, attributes) {
      const operation = operations.find(
        operation => operation._id === needleOp._id
      )
      Object.assign(operation, attributes)
      return Promise.resolve(operation)
    }

    const groupBills = [{
      _id: 'b1',
      amount: 3.5,
      groupAmount: 5,
      originalAmount: 20,
      type: 'health_costs',
      originalDate: new Date(2017, 11, 13),
      date: new Date(2017, 11, 15),
      isRefund: true,
      vendor: 'Ameli'
    }, {
      _id: 'b2',
      amount: 1.5,
      groupAmount: 5,
      originalAmount: 20,
      type: 'health_costs',
      originalDate: new Date(2017, 11, 14),
      date: new Date(2017, 11, 16),
      isRefund: true,
      vendor: 'Ameli'
    }]

    const any = expect.any(Object)

    const tests = [
      {
        description: 'health bills with both credit and debit',
        bills: [{
          _id: 'b1',
          amount: 5,
          originalAmount: 20,
          type: 'health_costs',
          originalDate: new Date(2017, 11, 13),
          date: new Date(2017, 11, 15),
          isRefund: true,
          vendor: 'Ameli'
        }],
        options: { identifiers: ['CPAM'] },
        result: () => ({
          b1: {
            creditOperation: operationsById.cpam,
            debitOperation: operationsById.medecin
          }
        }),
        operations: {
          medecin: {
            reimbursements: [
              {
                billId: 'io.cozy.bills:b1',
                amount: 5,
                operationId: 'cpam'
              }
            ]
          },
          cpam: {
            bills: ['io.cozy.bills:b1']
          }
        }
      },
      {
        description: 'health bills with debit operation but without credit',
        options: { identifiers: ['CPAM'] },
        bills: [{
          _id: 'b1',
          amount: 5,
          originalAmount: 999,
          type: 'health_costs',
          originalDate: new Date(2017, 11, 13),
          date: new Date(2017, 11, 15),
          isRefund: true,
          vendor: 'Ameli'
        }],
        result: () => ({
          b1: {
            creditOperation: operationsById.cpam
          }
        }),
        operations: {
          cpam: {
            bills: ['io.cozy.bills:b1']
          }
        }
      },

      // Bills that have been reimbursed at the same date in the same
      // "bundle" have a "groupAmount" that is matched against
      // the debit operation
      {
        description: 'health bills with group amount with credit and debit',
        bills: groupBills,
        options: { identifiers: ['CPAM'] },
        result: () => ({
          b1: {
            bill: any,
            creditOperation: operationsById.cpam,
            debitOperation: any
          },
          b2: {
            bill: any,
            creditOperation: operationsById.cpam,
            debitOperation: any
          }
        }),
        operations: {
          cpam: {
            bills: ['io.cozy.bills:b1', 'io.cozy.bills:b2']
          }
        },
        extra: result => {
          expect(result.b1.debitOperation).toBe(result.b2.debitOperation)
          expect(result.b1.debitOperation.reimbursements.length).toBe(2)
        }
      },
      {
        description:
          'health bills with group amount with credit but without debit',
        options: { identifiers: ['CPAM'] },
        bills: groupBills.map(x => ({...x, originalAmount: 999 })),
        result: () => ({
          b1: { creditOperation: operationsById.cpam },
          b2: { creditOperation: operationsById.cpam }
        }),
        operations: {
          cpam: {
            bills: ['io.cozy.bills:b1', 'io.cozy.bills:b2']
          }
        }
      },
      {
        description: 'not health bills',
        bills: [{
          _id: 'b2',
          amount: 30,
          date: new Date(2017, 11, 8),
          vendor: 'SFR'
        }],
        options: { identifiers: ['SFR'] },
        result: () => ({
          b2: { debitOperation: operationsById.small_sfr }
        })
      }
    ]

    for (let test of tests) {
      const fn = test.fn || it
      fn(test.description, async () => {
        if (test.disabled) {
          return
        }
        if (test.dbOperations) {
          test.dbOperations.forEach(op => operations.push(op))
          test.dbOperations.forEach(op => {
            operationsById[op._id] = op
          })
        }
        const options = { ...defaultOptions, ...test.options }
        const result = await linker.linkBillsToOperations(test.bills, options)
        expect(result).toMatchObject(test.result())
        for (let [operationId, matchObject] of Object.entries(
          test.operations || {}
        )) {
          expect(operationsById[operationId]).toMatchObject(matchObject)
        }
        if (test.extra) {
          test.extra(result)
        }
      })
    }

    it('should not link twice', async () => {
      const test = tests[0]
      const options = { ...defaultOptions, ...test.options }
      expect(operationsById.medecin.reimbursements).toBe(undefined)
      await linker.linkBillsToOperations(test.bills, options)
      expect(operationsById.medecin.reimbursements.length).toBe(1)
      await linker.linkBillsToOperations(test.bills, options)
      expect(operationsById.medecin.reimbursements.length).toBe(1)
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

    describe('groupBills', () => {
      const bills = [
        {
          _id: 'b1',
          originalDate: new Date(2018, 2, 10),
          vendor: 'Ameli',
          type: 'health_costs'
        },
        {
          _id: 'b2',
          originalDate: new Date(2018, 2, 10),
          vendor: 'Numéricable',
          type: 'health_costs'
        },
        {
          _id: 'b3',
          originalDate: new Date(2018, 2, 10),
          vendor: 'Ameli',
          type: 'health_costs'
        },
        {
          _id: 'b4',
          originalDate: new Date(2018, 2, 15),
          vendor: 'Ameli',
          type: 'health_costs'
        },
        {
          _id: 'b5',
          originalDate: new Date(2018, 2, 15),
          vendor: 'Ameli',
          type: 'health_costs'
        },
        {
          _id: 'b6',
          originalDate: new Date(2018, 2, 20),
          vendor: 'Numéricable'
        },
        {
          _id: 'b7',
          originalDate: new Date(2018, 2, 20),
          vendor: 'Ameli',
          type: 'health_costs'
        },
        {
          _id: 'b8',
          originalDate: new Date(2018, 2, 20),
          vendor: 'Numéricable'
        },
        {
          _id: 'b9',
          originalDate: new Date(2018, 2, 20),
          vendor: 'Ameli',
          type: 'health_costs'
        },
        {
          _id: 'b10',
          originalDate: new Date(2018, 2, 30),
          vendor: 'Numéricable'
        }
      ]

      it('groups bills by vendor and originalDate', () => {
        const result = linker.groupBills(bills)

        expect(result).toContainEqual([bills[0], bills[2]])
        expect(result).toContainEqual([bills[1]])
        expect(result).toContainEqual([bills[3], bills[4]])
        expect(result).toContainEqual([bills[5], bills[7]])
        expect(result).toContainEqual([bills[6], bills[8]])
        expect(result).toContainEqual([bills[9]])
      })
    })

    describe('generateBillsCombinations', () => {
      const bills = [{ _id: 'b1' }, { _id: 'b2' }, { _id: 'b3' }, { _id: 'b4' }]

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
