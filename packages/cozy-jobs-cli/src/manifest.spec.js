const { getScopes } = require('./manifest')

describe('getScopes', () => {
  test('getScopes', () => {
    const scopes = getScopes('./tests/manifest-test.webapp')
    expect(scopes).toEqual([
      'io.cozy.files:GET,POST,PUT,PATCH',
      'io.cozy.foo',
      'io.cozy.bar:ALL'
    ])
  })
})
