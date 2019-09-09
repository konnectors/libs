jest.mock('./cozyclient', () => ({
  data: {
    updateAttributes: jest.fn(),
    find: jest.fn()
  },
  files: {
    statById: jest.fn()
  }
}))

const { mockEnvVariables, asyncResolve } = require('./testUtils')
const client = require('./cozyclient')
const BaseKonnector = require('./BaseKonnector')
const logger = require('cozy-logger')

logger.setLevel('error')

const findFolderPath = BaseKonnector.findFolderPath

describe('finding folder path', () => {
  it('should find folder from fields', async () => {
    const fields = {
      folder_to_save: 'id-folder'
    }
    jest
      .spyOn(client.files, 'statById')
      .mockResolvedValue({ attributes: { path: '/Administrative' } })
    const path = await findFolderPath(fields)
    expect(client.files.statById).toHaveBeenCalledWith('id-folder', false)
    expect(path).toBe('/Administrative')
  })

  it('should find folder from account', async () => {
    const fields = {}
    const account = { folderId: 'id-folder' }
    jest
      .spyOn(client.files, 'statById')
      .mockResolvedValue({ attributes: { path: '/Administrative' } })
    const path = await findFolderPath(fields, account)
    expect(client.files.statById).toHaveBeenCalledWith('id-folder', false)
    expect(path).toBe('/Administrative')
  })
})

describe('run', () => {
  const envFields = {
    COZY_FIELDS: JSON.stringify({
      COZY_URL: 'http://cozy.tools:8080',
      fields: {
        login: 'mylogin',
        password: 'mypassword'
      }
    })
  }

  mockEnvVariables(envFields)

  const setup = fetch => {
    class Konnector extends BaseKonnector {
      fetch() {
        return fetch()
      }
    }
    const konn = new Konnector()
    jest.spyOn(konn, 'fail')
    jest.spyOn(konn, 'end')
    jest.spyOn(konn, 'getAccount').mockResolvedValue({
      _id: 'konnector-account',
      auth: {
        login: 'mylogin',
        password: 'mypassword'
      }
    })

    return { konn }
  }

  it('should have initialized attributes for access in main', async () => {
    const { konn } = setup(() => {})
    await konn.initAttributes()
    expect(konn.fields).toEqual({ login: 'mylogin', password: 'mypassword' })
  })

  it('should call end() on success', async () => {
    const { konn } = setup(() => {})
    await konn.run()
    expect(konn.end).toHaveBeenCalled()
  })

  it('should call fail() on error', async () => {
    const err = new Error()

    const { konn } = setup(() => {
      throw err
    })

    // Must mock terminate otherwise the process exits with 1
    jest.spyOn(konn, 'terminate').mockImplementation(() => {})
    await konn.run()
    expect(konn.end).not.toHaveBeenCalled()
    expect(konn.fail).toHaveBeenCalledWith(err)
  })
})

describe('methods', () => {
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
})
