const cozyClient = require('./cozyclient')
const saveIdentity = require('./saveIdentity').saveIdentity
const formatIdentityContact = require('./saveIdentity').formatIdentityContact
const trimProperties = require('./saveIdentity').trimProperties
const updateOrCreate = require('./updateOrCreate')

jest.mock('./updateOrCreate')
jest.mock('./cozyclient', () => ({
  new: {
    query: jest.fn(),
    save: jest.fn()
  }
}))

describe('saveIdentity', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should updateOrCreate a full identity with given identifier', async () => {
    await saveIdentity(
      { contact: { name: 'test' }, tax_information: { aj: 20 } },
      'myidentifier'
    )
    expect(updateOrCreate).toHaveBeenCalledWith(
      [
        {
          contact: { name: 'test' },
          tax_information: { aj: 20 },
          identifier: 'myidentifier'
        }
      ],
      'io.cozy.identities',
      ['identifier', 'cozyMetadata.createdByApp'],
      { sourceAccountIdentifier: 'myidentifier' }
    )
  })

  it('should updateOrCreate a full identity with given contact (for retro compatibility)', async () => {
    await saveIdentity({ name: 'test' }, 'myidentifier')
    expect(updateOrCreate).toHaveBeenCalledWith(
      [
        {
          contact: { name: 'test' },
          identifier: 'myidentifier'
        }
      ],
      'io.cozy.identities',
      ['identifier', 'cozyMetadata.createdByApp'],
      { sourceAccountIdentifier: 'myidentifier' }
    )
  })

  it('should use old updateOrCreate if no merge option is specified', async () => {
    await saveIdentity({ contact: { name: 'test' } }, 'myidentifier')
    expect(updateOrCreate).toHaveBeenCalled()
  })

  it('shoud use old updateOrCreate if merge option is true ', async () => {
    await saveIdentity({ contact: { name: 'test' } }, 'myidentifier', {
      merge: true
    })
    expect(updateOrCreate).toHaveBeenCalled()
  })

  it('should create a new identity if merge option is false', async () => {
    cozyClient.new.query.mockResolvedValue({ data: [] }) // No identity return
    await saveIdentity({ contact: { name: 'test' } }, 'myidentifier', {
      merge: false
    })
    expect(updateOrCreate).not.toHaveBeenCalled()
    expect(cozyClient.new.save).toHaveBeenCalledWith({
      _type: 'io.cozy.identities',
      contact: { name: 'test' },
      identifier: 'myidentifier'
    })
  })

  it('should replace the existing identity if merge option is false', async () => {
    cozyClient.new.query.mockResolvedValue({
      data: [
        {
          contact: { name: 'test', todelete: 'test' }, // Should delete one attribute
          _id: 'fakeid',
          identifier: 'myidentifier'
        }
      ]
    })
    await saveIdentity({ contact: { name: 'test2' } }, 'myidentifier', {
      merge: false
    })
    expect(updateOrCreate).not.toHaveBeenCalled()
    expect(cozyClient.new.save).toHaveBeenCalledWith({
      _type: 'io.cozy.identities',
      _id: 'fakeid',
      contact: { name: 'test2' },
      identifier: 'myidentifier'
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
