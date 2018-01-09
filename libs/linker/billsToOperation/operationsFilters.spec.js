import {
  filterByIdentifiers,
  filterByDates,
  filterByAmount,
  order
} from './operationsFilters'

describe('operationsFilters', () => {
  describe('filterByIdentifiers', () => {
    test('throw Error when "operations" param is not an array', () => {
      expect(() => filterByIdentifiers('mistake', [])).toThrowError(Error)
    })
    test('throw Error when "identifiers" param is not an array', () => {
      expect(() => filterByIdentifiers([], 'mistake')).toThrowError(Error)
    })

    test('filterByIdentifiers return empty array by default', () => {
        expect(filterByIdentifiers([], [])).toEqual([])
    })

    test('filterByIdentifiers return operations', () => {
      const ops1 = [{label: 'yzoc'}, {label: 'cozy'}]
      const ops2 = [{label: 'isssok'}, {label: 'kosssi'}]

      const identifiers1 = []
      const identifiers2 = ['ok']
      const identifiers3 = ['ko', 'ok']

      expect(filterByIdentifiers(ops1, identifiers1)).toEqual([])
      expect(filterByIdentifiers(ops1, identifiers2)).toEqual([])
      expect(filterByIdentifiers(ops2, identifiers2)).toEqual([ops2[0]])
      expect(filterByIdentifiers(ops2, identifiers3)).toEqual(ops2)
    })
  })

  describe('filterByDates', () => {
    const now = new Date()

    test('throw Error when "operations" param is not an array', () => {
      expect(() => filterByDates('mistake', now, now)).toThrowError(Error)
    })
    test('throw Error when "startDate" param is not a Date', () => {
      expect(() => filterByDates([], 'mistake', now)).toThrowError(Error)
    })
    test('throw Error when "endDate" param is not a Date', () => {
      expect(() => filterByDates([], now, 'mistake')).toThrowError(Error)
    })

    test('filterByDates return empty array by default', () => {
      expect(filterByDates([], now, now)).toEqual([])
    })

    test('filterByDates return operations', () => {
      const ops = [
        { date: new Date(2018, 1, 1) },
        { date: new Date(2018, 1, 2) },
        { date: new Date(2018, 1, 3) },
        { date: new Date(2018, 1, 4) }
      ]
      const beforeDate = new Date(2017, 10, 24)
      const afterDate = new Date(2019, 1, 7)

      // before
      expect(filterByDates(ops, beforeDate, ops[1].date)).toEqual([ops[0], ops[1]])
      // between
      expect(filterByDates(ops, ops[1].date, ops[2].date)).toEqual([ops[1], ops[2]])
      expect(filterByDates(ops, beforeDate, afterDate)).toEqual(ops)
      // after
      expect(filterByDates(ops, ops[2].date, afterDate)).toEqual([ops[2], ops[3]])
    })
  })

  describe('filterByAmount', () => {
    const startA = 12.3
    const endA = 12.5

    test('throw Error when "operations" param is not an array', () => {
      expect(() => filterByAmount('mistake', startA, endA)).toThrowError(Error)
    })
    test('throw Error when "startAmount" param is not an Number', () => {
      expect(() => filterByAmount([], 'mistake', endA)).toThrowError(Error)
    })
    test('throw Error when "endAmount" param is not an Number', () => {
      expect(() => filterByAmount([], startA, 'mistake')).toThrowError(Error)
    })

    test('filterByAmount return empty array by default', () => {
      expect(filterByAmount([], startA, endA)).toEqual([])
    })

    const ops = [
      { amount: 12 },
      { amount: 12.3 },
      { amount: 12.4 },
      { amount: 12.5 },
      { amount: 13 }
    ]
    const beforeAmount = 10
    const afterAmount = 14

    // before
    expect(filterByAmount(ops, beforeAmount, ops[1].amount)).toEqual([ops[0], ops[1]])
    // between
    expect(filterByAmount(ops, ops[1].amount, ops[2].amount)).toEqual([ops[1], ops[2]])
    expect(filterByAmount(ops, beforeAmount, afterAmount)).toEqual(ops)
    // after
    expect(filterByAmount(ops, ops[3].amount, afterAmount)).toEqual([ops[3], ops[4]])
  })

  describe('order', () => {
    const bill1 = { amount: 13.5, date: new Date(2018, 1, 1) }
    const op1 = { _id: 1, amount: -12, date: new Date(2018, 1, 1) }
    const op2 = { _id: 2, amount: -13, date: new Date(2018, 1, 1) }
    const op3 = { _id: 3, amount: -14, date: new Date(2018, 1, 1) }
    const op4 = { _id: 4, amount: -15, date: new Date(2018, 1, 1) }
    const op5 = { _id: 2, amount: -13, date: new Date(2018, 1, 2) }

    const order1 = order(bill1, [op1, op2, op3, op4])
    expect(order1[0]).toEqual(op2)

    const order2 = order(bill1, [op1, op5, op3, op4])
    expect(order2[0]).toEqual(op3)
  })
})
