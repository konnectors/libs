/**
 * @module mkdirp
 */

const { basename, dirname, join } = require('path').posix
const cozyClient = require('./cozyclient')

const log = () => {}

// The default exported `mkdirp` function is configured with the `cozyClient`
// from `cozy-konnector-libs`.
const mkdirp = fromCozy(cozyClient)

/**
 * Creates a directory and its missing ancestors as needed.
 *
 * Options :
 *
 * - `...pathComponents`:  one or many path components to be joined
 *
 * ```javascript
 * await mkdirp('/foo') // Creates /foo
 * await mkdirp('/foo') // Does nothing as /foo already exists
 * await mkdirp('/bar/baz') // Creates /bar, then /bar/baz
 * await mkdirp('/foo/bar/baz') // Creates /foo/bar, then /foo/bar/baz, not /foo
 * await mkdirp('/') // Does nothing
 * await mkdirp('/qux', 'qux2/qux3', 'qux4') // Creates /qux, then /qux/qux2,
 *                                           // then /qux/qux2/qux3 and
 *                                           // finally /qux/qux2/qux3/qux4
 * ```
 *
 * The function will automatically add a leading slash when missing:
 *
 * ```javascript
 * await mkdirp('foo', 'bar') // Creates /foo, then /foo/bar
 * ```
 *
 * @alias module:mkdirp
 */
module.exports = mkdirp

// `fromCozy()` builds an mkdirp() function for the given Cozy client.
// Useful for testing.
mkdirp.fromCozy = fromCozy

function fromCozy(cozy) {
  return async function mkdirp(...pathComponents) {
    const path = join('/', ...pathComponents)
    const pathRepr = JSON.stringify(path)

    log('debug', `Checking wether directory ${pathRepr} exists...`)
    let doc = null
    try {
      doc = await cozy.files.statByPath(path)
      log('debug', `Directory ${pathRepr} found.`)
      return doc
    } catch (err) {
      if (![404, 409].includes(err.status)) throw err
      log('debug', `Directory ${pathRepr} not found.`)

      const name = basename(path)
      const parentPath = dirname(path)
      const parentDoc = await mkdirp(parentPath)

      log('info', `Creating directory ${pathRepr}...`)
      try {
        doc = await cozy.files.createDirectory({
          name,
          dirID: parentDoc._id
        })
        log('info', `Directory ${pathRepr} created!`)
        return doc
      } catch (createErr) {
        if (![404, 409].includes(createErr.status)) throw createErr
        log('info', 'Directory already exists')
        return doc
      }
    }
  }
}
