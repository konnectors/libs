import {
  filterByIdentifiers,
  filterByDates,
  filterByAmounts,
  filterByCategory,
  filterByReimbursements,
  operationsFilters
} from './operationsFilters'

describe('operationsFilters', () => {
  test('filterByIdentifiers', () => {
    const identifiers = ['tRaInLiNe']
    const fByIdentifiers = filterByIdentifiers(identifiers)

    expect(fByIdentifiers({ label: 'Trainline !!!'})).toBeTruthy()
    expect(fByIdentifiers({ label: 'Yes Trainline'})).toBeTruthy()
    expect(fByIdentifiers({ label: 'CapitainTrain'})).toBeFalsy()
  })

  test('filterByDates', () => {
    const rangeDates = {
      minDate: new Date(2018, 0, 16),
      maxDate: new Date(2018, 0, 18)
    }
    const fByDates = filterByDates(rangeDates)

    expect(fByDates({ date: new Date(2018, 0, 15)})).toBeFalsy()
    expect(fByDates({ date: new Date(2018, 0, 16)})).toBeTruthy()
    expect(fByDates({ date: new Date(2018, 0, 17)})).toBeTruthy()
    expect(fByDates({ date: new Date(2018, 0, 18)})).toBeTruthy()
    expect(fByDates({ date: new Date(2018, 0, 19)})).toBeFalsy()
  })

  describe('filterByAmounts', () => {
    it('should pass when amount is within range', () => {
      const rangeDates = {
        minAmount: 16,
        maxAmount: 18
      }
      const fByAmounts = filterByAmounts(rangeDates)

      expect(fByAmounts({ amount: 15 })).toBeFalsy()
      expect(fByAmounts({ amount: 16 })).toBeTruthy()
      expect(fByAmounts({ amount: 17 })).toBeTruthy()
      expect(fByAmounts({ amount: 18 })).toBeTruthy()
      expect(fByAmounts({ amount: 19 })).toBeFalsy()
    })
  })

  describe('filterByCategory', () => {
    test('health bill', () => {
      const fByCategory = filterByCategory({vendor: 'Ameli'})
      expect(fByCategory({ manualCategoryId: '400610' })).toBeTruthy()
      expect(fByCategory({ automaticCategoryId: '400610' })).toBeTruthy()
      expect(fByCategory({ manualCategoryId: '0' })).toBeTruthy()
      expect(fByCategory({ automaticCategoryId: '0' })).toBeTruthy()
      expect(fByCategory({})).toBeTruthy()
      expect(fByCategory({ manualCategoryId: '400611' })).toBeFalsy()
      expect(fByCategory({ automaticCategoryId: '400611' })).toBeFalsy()
    })
    test('not health bill', () => {
      const fByCategory = filterByCategory({vendor: 'SFR'})
      expect(fByCategory({ manualCategoryId: '400610' })).toBeFalsy()
      expect(fByCategory({ automaticCategoryId: '400610' })).toBeFalsy()
      expect(fByCategory({ manualCategoryId: '0' })).toBeTruthy()
      expect(fByCategory({ automaticCategoryId: '0' })).toBeTruthy()
      expect(fByCategory({})).toBeTruthy()
      expect(fByCategory({ manualCategoryId: '400611' })).toBeTruthy()
      expect(fByCategory({ automaticCategoryId: '400611' })).toBeTruthy()
    })
  })

  describe('filterByReimbursements', () => {
    const fReimbursements = filterByReimbursements({ amount: 10 })
    expect(fReimbursements({ reimbursements: [{ amount: 10}], amount: -10})).toBe(false)
    expect(fReimbursements({ reimbursements: [{ amount: 7}, { amount: 3}], amount: -10})).toBe(false)
    expect(fReimbursements({ reimbursements: [{ amount: 7}, { amount: 3}], amount: -20})).toBe(true)
  })

  describe('operationsFilters', () => {
    const operations = [
      { amount: -20, label: 'Visite chez le médecin', _id: 'o1', date: new Date(2017, 11, 13), automaticCategoryId: '400610' },
      { amount: 5, label: 'Remboursement CPAM', _id: 'o2', date: new Date(2017, 11, 15), automaticCategoryId: '400610' },
      { amount: -120, label: 'Facture SFR', _id: 'o3', date: new Date(2017, 11, 8) },
      { amount: -30, label: 'Facture SFR', _id: 'o4', date: new Date(2017, 11, 7) },
      { amount: -80, label: "Matériel d'escalade", _id: 'o5', date: new Date(2017, 11, 7) },
      { amount: -5.5, label: 'Burrito', _id: 'o6', date: new Date(2017, 11, 5) },
      { amount: -2.6, label: 'Salade', _id: 'o7', date: new Date(2017, 11, 6) },
      {
        amount: 50,
        label: 'Remboursement CPAM',
        _id: 'o8',
        date: new Date(2017, 11, 15),
        automaticCategoryId: '400610',
        reimbursements: [
          {amount: 50}
        ]
      },
      {
        amount: -50,
        label: 'Visite chez le dentiste',
        _id: 'o9',
        automaticCategoryId: '400610',
        date: new Date(2017, 11, 16),
        reimbursements: []
      },
      {
        amount: -7.50,
        label: 'Dafalgan',
        _id: 'o10',
        automaticCategoryId: '400610',
        date: new Date(2017, 11, 16),
        reimbursements: []
      },
      {
        amount: 57.50,
        label: 'Remboursement CPAM',
        _id: 'o11',
        automaticCategoryId: '400610',
        date: new Date(2017, 11, 16),
        reimbursements: []
      },
    ]

    const defaultOptions = {
      minAmountDelta: 1, maxAmountDelta: 1,
      pastWindow: 1, futureWindow: 1
    }

    describe('health bill', () => {
      const bill = {
        amount: 5,
        originalAmount: 20,
        type: 'health_costs',
        originalDate: new Date(2017, 11, 13),
        date: new Date(2017, 11, 15),
        isRefund: true,
        vendor: 'Ameli',
      }

      const debitOptions = { ...defaultOptions, identifiers: ['CPAM'] }
      const creditOptions = { ...debitOptions, credit: true }

      test('get debit operation', () => {
        expect(operationsFilters(bill, operations, debitOptions))
          .toEqual([operations[0]])
      })

      test('get credit operation', () => {
        expect(operationsFilters(bill, operations, creditOptions))
          .toEqual([operations[1]])
      })
    })

    describe('not health bill', () => {
      const bill = {
        amount: 30,
        date: new Date(2017, 11, 8),
        vendor: 'SFR',
      }

      const debitOptions = { ...defaultOptions, identifiers: ['SFR'] }
      const creditOptions = { ...debitOptions, credit: true }

      test('get debit operation', () => {
        expect(operationsFilters(bill, operations, debitOptions))
          .toEqual([operations[3]])
      })

      test('get credit operation', () => {
        expect(operationsFilters(bill, operations, creditOptions))
          .toEqual([])
      })
    })

    describe('group amount', () => {
      const bill = {
        amount: 50,
        groupAmount: 57.5,
        date: new Date(2017, 11, 16),
        vendor: 'Ameli',
        type: 'health_costs',
        isRefund: true
      }
      const debitOptions = { ...defaultOptions, identifiers: ['CPAM'] }
      const creditOptions = { ...debitOptions, credit: true }
      it('get debit operation', () => {
        expect(operationsFilters(bill, operations, debitOptions))
          .toEqual([operations[8]])
      })

      test('get credit operation', () => {
        expect(operationsFilters(bill, operations, creditOptions))
          .toEqual([operations[10]])
      })
    })
  })
})
