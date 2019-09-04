jest.mock('./cozyclient', () => ({
  data: {
    updateAttributes: jest.fn(),
    find: jest.fn()
  }
}))

const asyncResolve = data =>
  new Promise(resolve => setImmediate(() => resolve(data)))

const client = require('./cozyclient')
jest.mock('./signin')
const signin = require('./signin')
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
      asyncResolve({ twoFACode: 'expected code' })
    )
    client.data.updateAttributes.mockReturnValue(asyncResolve({}))
    process.env.COZY_JOB_MANUAL_EXECUTION = 'true'
    const code = await konn.waitForTwoFaCode({ heartBeat: 100 })
    expect(code).toEqual('expected code')
    expect(client.data.find).toHaveBeenCalled()
    expect(client.data.updateAttributes).toHaveBeenCalledTimes(2)
    expect(client.data.updateAttributes.mock.calls[0][2].state).toEqual(
      'TWOFA_NEEDED.EMAIL'
    )
    expect(client.data.updateAttributes.mock.calls[1][2].twoFACode).toEqual(
      null
    )
  })

  it('waitForTwoFaCode should throw on endTime', async () => {
    client.data.find.mockReturnValue(asyncResolve({ twoFACode: null }))
    client.data.updateAttributes.mockReturnValue(asyncResolve({}))
    try {
      await konn.waitForTwoFaCode({ endTime: Date.now() })
    } catch (err) {
      expect(err.message).toEqual('USER_ACTION_NEEDED.TWOFA_EXPIRED')
    }
  })

  describe('deactivation of auto successful login', () => {
    beforeEach(() => {
      client.data.updateAttributes.mockReturnValue(asyncResolve({}))
    })

    it('should deactivateAutoSuccessfulLogin', async () => {
      await konn.deactivateAutoSuccessfulLogin()
      expect(client.data.updateAttributes).toHaveBeenCalledWith(
        'io.cozy.accounts',
        'account-id',
        {
          state: 'HANDLE_LOGIN_SUCCESS'
        }
      )
    })

    it('should do nothing after first call', async () => {
      await konn.deactivateAutoSuccessfulLogin()
      await konn.deactivateAutoSuccessfulLogin()
      expect(client.data.updateAttributes).toHaveBeenCalledTimes(1)
    })
  })

  it('should notify of successful login', async () => {
    client.data.updateAttributes.mockReturnValue(asyncResolve({}))
    await konn.notifySuccessfulLogin()
    expect(client.data.updateAttributes).toHaveBeenCalledWith(
      'io.cozy.accounts',
      'account-id',
      {
        state: 'LOGIN_SUCCESS'
      }
    )
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

  describe('signin method', () => {
    it('should call notify login methods', async () => {
      konn.deactivateAutoSuccessfulLogin = jest.fn()
      konn.notifySuccessfulLogin = jest.fn()
      signin.mockResolvedValue('signin output')
      const result = await konn.signin('signin input')
      expect(konn.deactivateAutoSuccessfulLogin).toHaveBeenCalledTimes(1)
      expect(signin).toHaveBeenCalledTimes(1)
      expect(signin).toHaveBeenCalledWith('signin input')
      expect(konn.notifySuccessfulLogin).toHaveBeenCalledTimes(1)
      expect(result).toEqual('signin output')
    })
  })
})
