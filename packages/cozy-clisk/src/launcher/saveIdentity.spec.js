import saveIdentity from './saveIdentity'

describe('saveIdentity', function () {
  const client = {
    query: jest.fn(),
    save: jest.fn(),
    appMetadata: {
      slug: 'testslug'
    }
  }
  beforeEach(function () {
    jest.clearAllMocks()
    jest.resetAllMocks()
  })

  it('should save identity when no identical identity is found', async () => {
    const identity = {
      email: 'test@mail.com'
    }

    client.query.mockResolvedValue({
      data: null
    })

    await saveIdentity(identity, 'testSourceAccountIdentifier', { client })

    expect(client.save).toHaveBeenCalledWith({
      contact: identity,
      identifier: 'testSourceAccountIdentifier',
      _type: 'io.cozy.identities'
    })
  })

  it('should update identity when identity createdWith the same app and with the same identifier is found', async () => {
    const identity = {
      email: 'test2@mail.com'
    }

    client.query.mockResolvedValue({
      data: [
        {
          _id: 'testid',
          _rev: 'testrev',
          _type: 'io.cozy.identities',
          contact: {
            email: 'testprevious@mail.com'
          },
          identifier: 'testSourceAccountIdentifier'
        }
      ]
    })

    await saveIdentity(identity, 'testSourceAccountIdentifier', { client })

    expect(client.save).toHaveBeenCalledWith({
      contact: identity,
      identifier: 'testSourceAccountIdentifier',
      _type: 'io.cozy.identities',
      _id: 'testid',
      _rev: 'testrev'
    })
  })

  it('should update identity with previous identity metadata', async () => {
    const identity = {
      email: 'test2@mail.com'
    }

    client.query.mockResolvedValue({
      data: [
        {
          _id: 'testid',
          _rev: 'testrev',
          _type: 'io.cozy.identities',
          contact: {
            email: 'testprevious@mail.com'
          },
          cozyMetadata: {
            createdByApp: 'testslug'
          },
          identifier: 'testSourceAccountIdentifier'
        }
      ]
    })

    await saveIdentity(identity, 'testSourceAccountIdentifier', { client })

    expect(client.save).toHaveBeenCalledWith({
      contact: identity,
      identifier: 'testSourceAccountIdentifier',
      cozyMetadata: {
        createdByApp: 'testslug'
      },
      _type: 'io.cozy.identities',
      _id: 'testid',
      _rev: 'testrev'
    })
  })
})
