const { join } = require('path').posix
const mkdirpFromCozy = require('./mkdirp').fromCozy

describe('mkdirp', () => {
  let cozy, mkdirp, newClient, statByPath

  it('creates the directory when missing', async () => {
    assumeDir('/')
    await mkdirp('/foo')
    expect(createdDirs()).toEqual(['/foo'])
  })

  it('creates missing ancestor directories up to the root', async () => {
    assumeDir('/')
    await mkdirp('/foo/bar/baz')
    expect(createdDirs()).toEqual(['/foo', '/foo/bar', '/foo/bar/baz'])
  })

  it('creates missing ancestor directories up to an existing one', async () => {
    assumeDir('/foo/bar')
    await mkdirp('/foo/bar/baz/qux')
    expect(createdDirs()).toEqual(['/foo/bar/baz', '/foo/bar/baz/qux'])
  })

  it('does not create anything when the directory already exists', async () => {
    assumeDir('/foo')
    await mkdirp('/foo')
    expect(createdDirs()).toEqual([])
  })

  it('accepts multiple path components', async () => {
    assumeDir('/foo/bar')
    await mkdirp('/foo', 'bar/baz', 'qux')
    expect(createdDirs()).toEqual(['/foo/bar/baz', '/foo/bar/baz/qux'])
  })

  it('adds leading slash when missing', async () => {
    assumeDir('/foo')
    await mkdirp('foo', 'bar')
    expect(createdDirs()).toEqual(['/foo/bar'])
  })

  it('does not care about trailing slash', async () => {
    console.log(newClient)
    assumeDir('/foo')
    await mkdirp('foo/', 'bar', 'qux/')
    expect(createdDirs()).toEqual(['/foo/bar', '/foo/bar/qux'])
  })

  beforeEach(() => {
    /*cozy = {
      files: {
        statByPath: jest.fn(),
        createDirectory: jest.fn().mockImplementation(({ dirID, name }) => {
          // dirID is actually parent path mocked in statByPath() below
          const path = join(dirID, name)
          return Promise.resolve({ _id: path, path })
        })
      }
    }*/
    statByPath = jest.fn()
    newClient = {
      collection: () => ({
        statByPath,
        createDirectory: jest.fn().mockImplementation(({ dirID, name }) => {
          // dirID is actually parent path mocked in statByPath() below
          const path = join(dirID, name)
          return Promise.resolve({ _id: path, path })
        })
      })
    }
    mkdirp = mkdirpFromCozy(cozy)
  })

  function assumeDir(existingPath) {
//    cozy.files.statByPath.mockImplementation(path => {
    statByPath.mockImplementation(path => {
        if (existingPath.startsWith(path)) {
        // Use path as _id so we get it back in mocked createDirectory() above
        return Promise.resolve({ _id: path, path })
      } else {
        return Promise.reject({ status: 404 })
      }
    })
  }

  function createdDirs() {
    return cozy.files.createDirectory.mock.calls.map(args => {
      const { dirID, name } = args[0]
      // See statByPath() & createDirectory() mocks above
      return join(dirID, name)
    })
  }
})
