const logger = require('cozy-logger')

const CookieKonnector = require('./CookieKonnector')

logger.setLevel('error')

describe('Cookie konnector', () => {
  const setup = fetch => {
    class TestKonnector extends CookieKonnector {
      fetch() {
        return fetch.apply(this, arguments)
      }

      async getAccount() {
        return {}
      }

      terminate() {}

      saveAccountData() {}

      async testSession() {
        return true
      }
    }
    const konn = new TestKonnector()
    return { konn }
  }

  it('should initSession and saveSession', async () => {
    const { konn } = setup(() => {})
    const calls = []
    const log = msg => () => calls.push(msg)
    jest.spyOn(konn, 'initSession').mockImplementation(log('initSession'))
    jest.spyOn(konn, 'saveSession').mockImplementation(log('saveSession'))
    jest.spyOn(konn, 'end')
    await konn.run()
    expect(calls).toEqual(['initSession', 'saveSession'])
  })
})
