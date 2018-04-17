const normalizeFilename = require('./normalizeFilename')

describe('normalizeFilename', () => {
  it('replaces OS/filesystem problematic characters with spaces', () => {
    expect(
      normalizeFilename('here<comes>a:very"long/file\\name|as?an*example')
    ).toEqual('here comes a very long file name as an example')
  })

  it('replaces cozy-stack forbidden characters with spaces', () => {
    expect(normalizeFilename('foo\0bar\rbaz\nqux')).toEqual('foo bar baz qux')
  })

  it('replaces multiple spaces or tabs with a single space', () => {
    expect(normalizeFilename('foo  bar \tbaz\t\tqux')).toEqual(
      'foo bar baz qux'
    )
  })

  it('does not concatenate multiple useless spaces', () => {
    expect(normalizeFilename('foo<>:\0 bar"/\\\rbaz\t|?*\nqux')).toEqual(
      'foo bar baz qux'
    )
  })

  it('does not prepend a useless space to the normalized name', () => {
    expect(normalizeFilename('<\0 foo')).toEqual('foo')
  })

  it('does not append a useless space to the normalized name', () => {
    expect(normalizeFilename('foo* \r')).toEqual('foo')
  })

  it('takes an optional extension with leading dot', () => {
    expect(normalizeFilename('foo/bar', '.qux')).toEqual('foo bar.qux')
  })

  it('adds the dot when missing', () => {
    expect(normalizeFilename('foo/bar', 'qux')).toEqual('foo bar.qux')
  })

  it('does not change an already valid name', () => {
    const validName = 'foo.bar'
    expect(normalizeFilename(validName)).toEqual(validName)
    expect(normalizeFilename('foo', '.bar')).toEqual(validName)
    expect(normalizeFilename('foo', 'bar')).toEqual(validName)
  })

  it('warns when name contains only problematic characters', () => {
    expect(() => normalizeFilename(' <>:"/\\|?*\0\n\r \t')).toThrow(/filename/)
  })

  it('is the responsibility of the function user to provide a valid extension', () => {
    expect(normalizeFilename('foo', '')).toEqual('foo.')
    expect(normalizeFilename('foo', '.')).toEqual('foo.')
    expect(normalizeFilename('foo', '..')).toEqual('foo..')
    expect(normalizeFilename('foo', '.-')).toEqual('foo.-')
  })
})
