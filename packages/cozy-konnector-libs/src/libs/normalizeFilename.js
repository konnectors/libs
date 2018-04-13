/**
 * Returns the given name, replacing characters that could be an issue when
 * used in a filename with underscores.
 *
 * Replaced characters include:
 *
 * - Those forbidden on one or many popular OS or filesystem: `<>:"/\|?*`
 * - Those forbidden by the cozy-stack `\0`, `\r` and `\n`
 * - Spaces and tabs (while those should work, preventing them may magically
 *   fix issues with other softwares)
 *
 * An exception will be thrown in case there is not any filename-compatible
 * character in the given name.
 *
 * Parameters:
 *
 * - `name` is whatever string you want to generate the filename from
 *
 * ```javascript
 * const { normalizeFilename } = require('cozy-konnector-libs')
 *
 * const filename = normalizeFilename('*foo/bar: <baz> \\"qux"\t???.txt')
 * // `filename` === `foo_bar_baz_qux.txt`
 * ```
 *
 * @module normalizeFilename
 */

const forbiddenCharsRegExp = /[<>:"/\\|?*\0\s]+/g

const normalizeFilename = name => {
  const filename = name.replace(forbiddenCharsRegExp, '_').replace(/^_|_$/g, '')
  if (filename === '') {
    throw new Error(
      'Cannot find any filename-compatible character in ' +
        JSON.stringify(name) +
        '!'
    )
  }
  return filename
}

module.exports = normalizeFilename
