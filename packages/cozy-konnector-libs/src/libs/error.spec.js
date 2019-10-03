const { attachProcessEventHandlers } = require('./error')

describe('error handling', () => {
  it('should attach handlers', () => {
    const process = {
      on: jest.fn(),
      off: jest.fn()
    }

    const cleanup = attachProcessEventHandlers(process)
    expect(process.on).toHaveBeenCalledTimes(4)
    attachProcessEventHandlers(process)
    expect(process.on).toHaveBeenCalledTimes(4)
    cleanup()
    expect(process.off).toHaveBeenCalledTimes(4)
    attachProcessEventHandlers(process)
    expect(process.on).toHaveBeenCalledTimes(8)
  })
})
