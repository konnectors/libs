import { callStringFunction, deserializeStringFunction } from './utils.js'

describe('deserializeStringFunction', () => {
  it('should parse simple function string', async () => {
    function fnStart(n) {
      return n + 1
    }
    const fnResult = deserializeStringFunction(fnStart.toString())
    const result = fnResult(3)
    expect(result).toEqual(4)
  })
  it('should parse arrow functions', () => {
    const fnStart = n => n + 1
    const fnResult = deserializeStringFunction(fnStart.toString())
    const result = fnResult(5)
    expect(result).toEqual(6)
  })
})

describe('callStringFunction', () => {
  it('should call a simple function with given parameters', async () => {
    function fnStart(n) {
      return n * 2
    }
    const result = await callStringFunction(fnStart.toString(), 3)
    expect(result).toEqual(6)
  })
  it('should await function returning Promises', async () => {
    function fnStart(n) {
      return new Promise(resolve => {
        window.setTimeout(() => resolve(n - 1), 10)
      })
    }
    const result = await callStringFunction(fnStart.toString(), 3)
    expect(result).toEqual(2)
  })
  it('should await arrow function returning Promises', async () => {
    const fnStart = n =>
      new Promise(resolve => window.setTimeout(() => resolve(n * 3)))
    const result = await callStringFunction(fnStart.toString(), 3)
    expect(result).toEqual(9)
  })
})
