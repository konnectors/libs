const { parseArgs } = require('./konnector-dev.js')

describe('arg parsing', () => {
  it('should default values', () => {
    const args = parseArgs([])
    expect(args).toEqual({
      createAccount: false,
      file: 'index.js',
      manifest: expect.stringContaining('/manifest.konnector'),
      token: expect.stringContaining('/.token.json')
    })
  })

  it('should default values', () => {
    const args = parseArgs(['myScript', '-a'])
    expect(args).toEqual({
      createAccount: true,
      file: expect.stringContaining('myScript'),
      manifest: expect.stringContaining('/manifest.konnector'),
      token: expect.stringContaining('/.token.json')
    })
  })
})
