const { attachProcessEventHandlers } = require('./error')

describe('error handling', () => {
  it('should attach handlers', () => {
    const process = {
      on: jest.fn(),
      removeEventListener: jest.fn()
    }

    const cleanup = attachProcessEventHandlers(process)
    expect(process.on).toHaveBeenCalledTimes(4)
    attachProcessEventHandlers(process)
    expect(process.on).toHaveBeenCalledTimes(4)
    cleanup()
    expect(process.removeEventListener).toHaveBeenCalledTimes(4)
    attachProcessEventHandlers(process)
    expect(process.on).toHaveBeenCalledTimes(8)
  })
})
