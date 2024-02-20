import saveIdentity, {
  formatIdentityContact,
  trimProperties
} from './saveIdentity'

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
      email: [
        {
          address: 'test@mail.com'
        }
      ]
    }

    client.query.mockResolvedValue({
      data: null
    })

    await saveIdentity(identity, 'testSourceAccountIdentifier', { client })

    expect(client.save).toHaveBeenCalledWith({
      contact: identity,
      identifier: 'testSourceAccountIdentifier',
      cozyMetadata: {
        sourceAccountIdentifier: 'testSourceAccountIdentifier'
      },
      _type: 'io.cozy.identities'
    })
  })

  it('should update identity when identity createdWith the same app and with the same identifier is found', async () => {
    const identity = {
      email: [
        {
          address: 'test2@mail.com'
        }
      ]
    }

    client.query.mockResolvedValue({
      data: [
        {
          _id: 'testid',
          _rev: 'testrev',
          _type: 'io.cozy.identities',
          contact: {
            email: [
              {
                address: 'testprevious@mail.com'
              }
            ]
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
        sourceAccountIdentifier: 'testSourceAccountIdentifier'
      },
      _type: 'io.cozy.identities',
      _id: 'testid',
      _rev: 'testrev'
    })
  })

  it('should update identity with previous identity metadata', async () => {
    const identity = {
      email: [
        {
          address: 'test2@mail.com'
        }
      ]
    }

    client.query.mockResolvedValue({
      data: [
        {
          _id: 'testid',
          _rev: 'testrev',
          _type: 'io.cozy.identities',
          contact: {
            email: [
              {
                address: 'testprevious@mail.com'
              }
            ]
          },
          cozyMetadata: {
            createdByApp: 'testslug',
            sourceAccountIdentifier: 'testSourceAccountIdentifier'
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
        createdByApp: 'testslug',
        sourceAccountIdentifier: 'testSourceAccountIdentifier'
      },
      _type: 'io.cozy.identities',
      _id: 'testid',
      _rev: 'testrev'
    })
  })
  it('should update identity when no sourceAccountIdentifier is found in CozyMetadata.sourceAccountIdentifier', async () => {
    const identity = {
      email: [
        {
          address: 'test2@mail.com'
        }
      ]
    }

    client.query.mockResolvedValue({
      data: [
        {
          _id: 'testid',
          _rev: 'testrev',
          _type: 'io.cozy.identities',
          contact: {
            email: [
              {
                address: 'testprevious@mail.com'
              }
            ]
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
        createdByApp: 'testslug',
        sourceAccountIdentifier: 'testSourceAccountIdentifier'
      },
      _type: 'io.cozy.identities',
      _id: 'testid',
      _rev: 'testrev'
    })
  })
})

describe('formatIdentityContact', () => {
  it('should format (create the array) phone, address & mail if only strings', () => {
    const contact = {
      phone: '0601020304',
      address: '1 rue de la paix',
      email: 'foo@cozycloud.cc'
    }
    const formattedContact = formatIdentityContact(contact)

    const expectedContact = {
      phone: [{ number: contact.phone }],
      address: [{ formattedAddress: contact.address }],
      email: [{ address: contact.email }]
    }

    expect(formattedContact).toEqual(expectedContact)
  })
  it('should format (create the array) phone, address & mail if string or array', () => {
    const contact = {
      phone: [{ number: '0601020304' }],
      address: '1 rue de la paix',
      email: 'foo@cozycloud.cc'
    }
    const formattedContact = formatIdentityContact(contact)

    const expectedContact = {
      phone: contact.phone,
      address: [{ formattedAddress: contact.address }],
      email: [{ address: contact.email }]
    }

    expect(formattedContact).toEqual(expectedContact)
  })
})

describe('trimProperties', () => {
  it('should trim all properties', () => {
    const contact = {
      address: [
        {
          city: ' CITY',
          formattedAddress: '86 CHEMIN DES DAMES 01001 CITY ',
          postCode: '01001',
          street: {
            streetName: ' DES DAMES',
            streetNumber: 86,
            streetType: 'CHEMIN'
          }
        }
      ],
      email: ' foo.bar@cozycloud.cc ',
      name: {
        firstName: 'Chris',
        fullName: 'Chris A',
        lastName: 'A'
      },
      phoneNumber: [
        {
          number: ' 060606060606',
          type: 'mobile'
        }
      ]
    }

    const expectedContact = {
      address: [
        {
          city: 'CITY',
          formattedAddress: '86 CHEMIN DES DAMES 01001 CITY',
          postCode: '01001',
          street: {
            streetName: 'DES DAMES',
            streetNumber: 86,
            streetType: 'CHEMIN'
          }
        }
      ],
      email: 'foo.bar@cozycloud.cc',
      name: {
        firstName: 'Chris',
        fullName: 'Chris A',
        lastName: 'A'
      },
      phoneNumber: [
        {
          number: '060606060606',
          type: 'mobile'
        }
      ]
    }

    expect(trimProperties(contact)).toEqual(expectedContact)
  })
})
