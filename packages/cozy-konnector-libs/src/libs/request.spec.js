const requestFactory = require('./request')

describe('requestFactory', function() {
  const defaultops = { json: false, cheerio: true }
  describe('when loading a `latin1` encoded page', () => {
    const latin1url =
      'https://www.credit-cooperatif.coop/portail/particuliers/login.do'
    it('should not be able to read it correctly if not told how', () => {
      const rq = requestFactory(defaultops)
      return rq(latin1url).then($ => {
        expect($('.navSecurite').text()).not.toEqual('sécurité')
      })
    })

    it('should be able to read it correctly if told how', () => {
      const rq = requestFactory({ encoding: 'latin1', ...defaultops })
      return rq(latin1url).then($ => {
        expect($('.navSecurite').text()).toEqual('sécurité')
      })
    })
  })
})
