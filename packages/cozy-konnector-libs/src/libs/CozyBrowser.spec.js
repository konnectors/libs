const CozyBrowser = require('./CozyBrowser')
const Zombie = require('zombie')

describe('CozyBrowser', () => {
  const Browser = CozyBrowser()
  const browser = new Browser()
  it('should get default userAgent by default', () => {
    expect(browser.userAgent).toEqual(
      'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:62.0) Gecko/20100101 Firefox/62.0'
    )
  })
  it('should get a zombie instance as a result', () => {
    expect(browser).toBeInstanceOf(Zombie)
  })
  it('should get a zombie instance with special cozy pipeline as pipeline', () => {
    expect(browser.pipeline.cozy).toBe(true)
  })
})
