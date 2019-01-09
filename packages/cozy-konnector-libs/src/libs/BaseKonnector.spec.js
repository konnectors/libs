jest.mock('./cozyclient', () => ({
  data: {
    updateAttributes: jest.fn()
  }
}))

const client = require('./cozyclient')
const BaseKonnector = require('./BaseKonnector')

describe('BaseKonnector', () => {
  let konn

  beforeEach(() => {
    konn = new BaseKonnector()
    konn.accountId = 'account-id'
    client.data.updateAttributes.mockReset()
  })

  it('should update account attributes and cache the account', async () => {
    client.data.updateAttributes.mockImplementation((doctype, id, attrs) => new Promise(resolve => {
      resolve({
        data: {
          preexistingData: 'here'
        },
        ...attrs
      })
    }))

    const newAuth = {
      login: '12345',
      password: '6789'
    }
    await konn.updateAccountAttributes({
      auth: newAuth
    })
    expect(client.data.updateAttributes).toHaveBeenCalledWith('io.cozy.accounts', 'account-id', {
      auth: newAuth
    })
    expect(konn._account).toMatchObject({
      data: {
        preexistingData: 'here',
      },
      auth: newAuth
    })
  })
})
