jest.mock('./updateOrCreate')
const updateOrCreate = require('./updateOrCreate')
const saveIdentity = require('./saveIdentity')

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
})
