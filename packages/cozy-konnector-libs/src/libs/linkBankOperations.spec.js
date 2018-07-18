import { Linker } from './linkBankOperations'

jest.mock('./cozyclient')
jest.mock('cozy-logger', () => ({
  namespace: () => () => ({})
}))
const cozyClient = require('./cozyclient')
const indexBy = require('lodash/keyBy')
const {
  parseBillLine,
  parseOperationLine,
  wrapAsFetchJSONResult
} = require('./testUtils')

let linker

beforeEach(function() {
  // We mock defineIndex/query so that fetchOperations returns the right operations
  const INDEX = 'index'
  cozyClient.data.defineIndex.mockReturnValue(Promise.resolve(INDEX))

  linker = new Linker(cozyClient)
  linker.updateAttributes = jest.fn().mockReturnValue(Promise.resolve())
})

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
      'medecin   | 13-12-2017 | Visite chez le médecin            | -20  | 400610',
      'cpam      | 15-12-2017 | Remboursement CPAM                | 5    | 400610',
      'big_sfr   | 08-12-2017 | Facture SFR                       | -120',
      'small_sfr | 07-12-2017 | Facture SFR                       | -30',
      "escalade  | 07-12-2017 | Remboursement Matériel d'escalade | 30",
      'burrito   | 05-12-2017 | Burrito                           | -5.5',
      'salade    | 06-12-2017 | Salade                            | -2.6'
    ].map(parseOperationLine)

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

    const any = expect.any(Object)

    const tests = [
      {
        description: 'health bills with both credit and debit',
        bills: [
          'b1 | 5 |     | 20 | 13-12-2017 | 15-12-2017 | true | Ameli | health_costs'
        ],
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
        bills: [
          'b1 | 5 |     | 999 | 13-12-2017 | 15-12-2017 | true | Ameli | health_costs'
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
        bills: [
          'b1 | 3.5 | 5 | 20 | 13-12-2017 | 15-12-2017 | true | Ameli | health_costs',
          'b2 | 1.5 | 5 | 20 | 14-12-2017 | 16-12-2017 | true | Ameli | health_costs'
        ],
        options: {
          identifiers: ['CPAM']
        },
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
        bills: [
          'b1 | 3.5 | 5 | 999 | 13-12-2018 | 15-12-2017 | true | Ameli | health_costs',
          'b2 | 1.5 | 5 | 999 | 14-12-2018 | 16-12-2017 | true | Ameli | health_costs'
        result: () => ({
          b1: { creditOperation: operationsById.cpam },
          b2: { creditOperation: operationsById.cpam }
        }),
        ],
        operations: {
          cpam: {
            bills: ['io.cozy.bills:b1', 'io.cozy.bills:b2']
          }
        }
      },
      {
        description: 'not health bills',
        options: { identifiers: ['SFR'] },
        bills: ['b2 | 30 |  |  |  | 07-12-2017 | false | SFR'],
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
