import { wrapTimer, wrapTimerFactory } from './wrapTimer'

describe('wrapTimer', () => {
  it('should wrap an async method and call the logger in the end', async () => {
    jest.useFakeTimers()
    const testfn = jest.fn().mockImplementation(async () => {
      jest.advanceTimersByTime(1234)
      return 'test result'
    })
    const myobj = {
      testfn
    }
    const logFn = jest.fn()
    myobj.testfn = wrapTimer(myobj, 'testfn', { logFn })

    const result = await myobj.testfn()

    expect(testfn).toHaveBeenCalled()
    expect(result).toStrictEqual('test result')
    expect(logFn).toHaveBeenCalledWith('⌛ testfn took 1.23s')
    jest.useRealTimers()
  })
})

describe('wrapTimerFactory', () => {
  it('should be able to force a logger by default', async () => {
    const testfn = jest.fn().mockResolvedValueOnce('test result')
    const myobj = {
      testfn
    }
    const logFn = jest.fn()
    const wrapTimer = wrapTimerFactory({ logFn })
    myobj.testfn = wrapTimer(myobj, 'testfn')

    const result = await myobj.testfn()

    expect(testfn).toHaveBeenCalled()
    expect(result).toStrictEqual('test result')
    expect(logFn).toHaveBeenCalledWith(
      expect.stringContaining('⌛ testfn took')
    )
  })
})
