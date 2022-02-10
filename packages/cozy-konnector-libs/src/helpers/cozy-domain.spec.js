const { getDomain, getInstance } = require('./cozy-domain')

describe('getDomain', function () {
  it('should get the Cozy domain from an url', () => {
    expect(getDomain('https://toto.mycozy.cloud')).toEqual('mycozy.cloud')
    expect(getDomain('http://a.cozy.rocks')).toEqual('cozy.rocks')
    expect(getDomain('http://cozy.tools:8080')).toEqual('cozy.tools')
  })
})

describe('getInstance', function () {
  it('should get the Cozy instance from an url', () => {
    expect(getInstance('https://toto.mycozy.cloud')).toEqual(
      'toto.mycozy.cloud'
    )
    expect(getInstance('http://a.cozy.rocks')).toEqual('a.cozy.rocks')
    expect(getInstance('http://cozy.tools:8080')).toEqual('cozy.tools')
  })
})
