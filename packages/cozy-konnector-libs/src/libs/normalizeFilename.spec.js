const normalizeFilename = require('./normalizeFilename')

describe('normalizeFilename', () => {
  it('replaces OS/filesystem problematic characters with underscores', () => {
    expect(
      normalizeFilename('here<comes>a:very"long/file\\name|as?an*example')
    ).toEqual('here_comes_a_very_long_file_name_as_an_example')
  })

  it('replaces cozy-stack forbidden characters with underscores', () => {
    expect(normalizeFilename('foo\0bar\rbaz\nqux')).toEqual('foo_bar_baz_qux')
  })

  it('replaces whitespaces and tabs with underscores', () => {
    expect(normalizeFilename('foo bar\tbaz')).toEqual('foo_bar_baz')
  })

  it('does not concatenate multiple useless underscores', () => {
    expect(normalizeFilename('foo<>:\0 bar"/\\\rbaz\t|?*\nqux')).toEqual(
      'foo_bar_baz_qux'
    )
  })

  it('does not prepend a useless underscore to the normalized name', () => {
    expect(normalizeFilename('<\0 foo')).toEqual('foo')
  })

  it('does not append a useless underscore to the normalized name', () => {
    expect(normalizeFilename('foo* \r')).toEqual('foo')
  })

  it('takes an optional extension with leading dot', () => {
    expect(normalizeFilename('foo/bar', '.qux')).toEqual('foo_bar.qux')
  })

  it('adds the dot when missing', () => {
    expect(normalizeFilename('foo/bar', 'qux')).toEqual('foo_bar.qux')
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
