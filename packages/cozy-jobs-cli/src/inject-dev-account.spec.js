const { mkdirp, BaseKonnector } = require('cozy-konnector-libs')

const injectDevAccount = require('./inject-dev-account')

describe('initDevAccount', () => {
  beforeEach(() => {
    mkdirp.mockReset()
  })

  it('should redefine getaccount', async () => {
    injectDevAccount({ login: 'testlogin', password: 'testpassword' })
    const connector = new BaseKonnector()
    expect(await connector.getAccount()).toEqual({
      _id: 'dev-konnector-account-id'
    })
  })

  it('should redefine initAttributes', async () => {
    injectDevAccount({
      fields: { login: 'testlogin', password: 'testpassword' }
    })
    const connector = new BaseKonnector()
    await connector.initAttributes()
    expect(mkdirp.mock.calls.length).toBe(1)
    expect(connector.fields).toEqual({
      login: 'testlogin',
      password: 'testpassword',
      folderPath: '/cozy-konnector-dev-root'
    })
  })
})
