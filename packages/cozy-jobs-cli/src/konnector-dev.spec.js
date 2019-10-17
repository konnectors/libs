const { parseArgs } = require('./konnector-dev.js')

describe('arg parsing', () => {
  it('should default values', () => {
    const args = parseArgs([])
    expect(args).toEqual({
      createAccount: false,
      file: 'index.js',
      manifest: '/Users/cozy/code/cozy/konnector-libs/manifest.konnector',
      token: '/Users/cozy/code/cozy/konnector-libs/.token.json'
    })
  })

  it('should default values', () => {
    const args = parseArgs(['myScript', '-a'])
    expect(args).toEqual({
      createAccount: true,
      file: expect.stringContaining('myScript'),
      manifest: '/Users/cozy/code/cozy/konnector-libs/manifest.konnector',
      token: '/Users/cozy/code/cozy/konnector-libs/.token.json'
    })
  })
})
