const {
  default: requestFactory,
  DEFAULT_USER_AGENT,
  ...request
} = require('./request')

describe('requestFactory', () => {
  describe('get request options', () => {
    const getRequestOptions = request.getRequestOptions
    const mergeDefaultOptions = request.mergeDefaultOptions

    test('without cheerio', () => {
      const options = getRequestOptions(
        mergeDefaultOptions({
          cheerio: false
        })
      )
      expect(options.transform).toBeUndefined()
      expect(options.headers['User-Agent']).toBeUndefined()
    })
    test('with cheerio', () => {
      const options = getRequestOptions(
        mergeDefaultOptions({
          cheerio: true
        })
      )
      expect(options.transform).toBeDefined()
      expect(options.headers['User-Agent']).toBe(DEFAULT_USER_AGENT)
    })
    test('user-defined UserAgent is preserved', () => {
      const options = getRequestOptions(
        mergeDefaultOptions({
          headers: {
            'User-Agent': 'My specific User-Agent'
          }
        })
      )
      expect(options.headers['User-Agent']).toBe('My specific User-Agent')
    })
    test('with cheerio, true and undefined generates default user-agent', () => {
      const options = getRequestOptions(
        mergeDefaultOptions({
          cheerio: true,
          userAgent: true
        })
      )
      expect(options.transform).toBeDefined()
      expect(options.headers['User-Agent']).toBe(DEFAULT_USER_AGENT)
    })
    test('with cheerio and user defined userAgent preserve user agent', () => {
      const options = getRequestOptions(
        mergeDefaultOptions({
          cheerio: true,
          headers: {
            'User-Agent': 'My specific User-Agent'
          }
        })
      )
      expect(options.transform).toBeDefined()
      expect(options.headers['User-Agent']).toBe('My specific User-Agent')
    })
  })

  describe('transform with cheerio', () => {
    const transformWithCheerio = request.transformWithCheerio
    test('get cheerio object', () => {
      const $ = transformWithCheerio('<h1>Hello, World!</h1>')
      expect($.text()).toEqual('Hello, World!')
    })
    test('accept resolveWithFullResponse option', () => {
      const response = transformWithCheerio('<h1>Hello, World!</h1>', {}, true)
      expect(response.body.text()).toEqual('Hello, World!')
    })
  })

  describe('merge default options', () => {
    const mergeDefaultOptions = request.mergeDefaultOptions

    test('should get default options', () => {
      const options = mergeDefaultOptions()
      expect(options).toEqual({
        debug: false,
        json: true,
        cheerio: false,
        headers: {},
        followAllRedirects: true
      })
    })
    test('should update default options with given ones', () => {
      const options = mergeDefaultOptions({
        debug: true,
        followAllRedirects: false
      })
      expect(options).toEqual({
        debug: true,
        json: true,
        cheerio: false,
        headers: {},
        followAllRedirects: false
      })
    })
    test('should deactivate json with cheerio on', () => {
      const options = mergeDefaultOptions({
        cheerio: true,
        json: true
      })
      expect(options.json).toBe(false)
    })
    test('should not activate json when cheerio false', () => {
      const options = mergeDefaultOptions({
        cheerio: false,
        json: false
      })
      expect(options.json).toBe(false)
    })
  })

  describe('TLS behavior assertions', () => {
    const rq = requestFactory({ resolveWithFullResponse: true })
    // Valid Cert
    test('Valid cert should success', async () => {
      const resp = await rq('https://badssl.com')
      expect(resp.statusCode).toBe(200)
    })
    // Not Valid Cert
    test('Expired cert should be refused', async () => {
      return expect(rq('https://expired.badssl.com')).rejects.toEqual(
        new Error('Error: certificate has expired')
      )
    })
    test('Wrong Host cert should be refused', async () => {
      expect.assertions(1)
      try {
        await rq('https://wrong.host.badssl.com')
      } catch (err) {
        expect(err.message).toMatch(
          /^.*Hostname\/IP.*match certificate's altnames.*$/
        )
      }
    })

    it('Untrust Root cert should be refused', async () => {
      expect.assertions(1)
      try {
        await rq('https://untrusted-root.badssl.com')
      } catch (err) {
        expect(err.message).toEqual(
          'Error: self-signed certificate in certificate chain'
        )
      }
    })

    test('Self-signed cert should be refused', async () => {
      return expect(rq('https://self-signed.badssl.com')).rejects.toEqual(
        new Error('Error: self-signed certificate')
      )
    })
  })

  describe.skip('when loading a `latin1` encoded page', () => {
    const defaultops = { json: false, cheerio: true }
    const latin1url =
      'https://www.credit-cooperatif.coop/portail/particuliers/login.do'
    test('should not be able to read it correctly if not told how', () => {
      const rq = requestFactory(defaultops)
      return rq(latin1url).then($ => {
        return expect($('.navSecurite').text()).not.toEqual('sécurité')
      })
    })

    test('should be able to read it correctly if told how', () => {
      const rq = requestFactory({ ...defaultops, encoding: 'latin1' })
      return rq(latin1url).then($ => {
        return expect($('.navSecurite').text()).toEqual('sécurité')
      })
    })
  })
})
