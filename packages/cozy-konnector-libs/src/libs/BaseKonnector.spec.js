jest.mock('./cozyclient', () => ({
  data: {
    updateAttributes: jest.fn(),
    find: jest.fn()
  }
}))

const asyncResolve = data =>
  new Promise(resolve => setImmediate(() => resolve(data)))

const client = require('./cozyclient')
const BaseKonnector = require('./BaseKonnector')

describe('BaseKonnector', () => {
  let konn

  beforeEach(() => {
    konn = new BaseKonnector()
    konn.accountId = 'account-id'
    client.data.updateAttributes.mockReset()
    client.data.find.mockReset()
  })

  it('waitForTwoFaCode should wait for 2FA code', async () => {
    client.data.find.mockReturnValue(
      asyncResolve({ twofa_code: 'expected code' })
    )
    client.data.updateAttributes.mockReturnValue(asyncResolve({}))
    const code = await konn.waitForTwoFaCode({ heartBeat: 100 })
    expect(code).toEqual('expected code')
    expect(client.data.find).toHaveBeenCalled()
    expect(client.data.updateAttributes).toHaveBeenCalledTimes(2)
    expect(client.data.updateAttributes.mock.calls[0][2].state).toEqual(
      'TWOFA_NEEDED.EMAIL'
    )
    expect(client.data.updateAttributes.mock.calls[1][2].twofa_code).toEqual(
      null
    )
  })

  it('waitForTwoFaCode should throw on timeout', async () => {
    client.data.find.mockReturnValue(asyncResolve({ twofa_code: null }))
    client.data.updateAttributes.mockReturnValue(asyncResolve({}))
    try {
      await konn.waitForTwoFaCode({ timeout: Date.now() })
    } catch (err) {
      expect(err.message).toEqual('USER_ACTION_NEEDED.TWOFA_EXPIRED')
    }
  })

  it('should update account attributes and cache the account', async () => {
    client.data.updateAttributes.mockImplementation(
      (doctype, id, attrs) =>
        new Promise(resolve => {
          resolve({
            data: {
              preexistingData: 'here'
            },
            ...attrs
          })
        })
    )

    const newAuth = {
      login: '12345',
      password: '6789'
    }
    await konn.updateAccountAttributes({
      auth: newAuth
    })
    expect(client.data.updateAttributes).toHaveBeenCalledWith(
      'io.cozy.accounts',
      'account-id',
      {
        auth: newAuth
      }
    )
    expect(konn._account).toMatchObject({
      data: {
        preexistingData: 'here'
      },
      auth: newAuth
    })
  })
})
