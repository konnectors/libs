/**
 * @typedef ArrayBufferWithContentType
 * @property {string} contentType - dataUri included content type
 * @property {ArrayBuffer} arrayBuffer - resulting decoded data
 */

/**
 * Converts a data URI string to an Array Buffer with its content Type
 *
 * @param {string} dataURI - data URI string containing content type and base64 encoded data
 * @returns {ArrayBufferWithContentType} : array buffer with content type
 */
export const dataUriToArrayBuffer = dataURI => {
  const parsed = dataURI.match(/^data:(.*);base64,(.*)$/)
  if (parsed === null) {
    throw new Error(
      'dataUriToArrayBuffer: dataURI is malformed. Should be in the form data:...;base64,...'
    )
  }
  const [contentType, base64String] = parsed.slice(1)
  const byteString = global.atob(base64String)
  const arrayBuffer = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(arrayBuffer)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  return { contentType, arrayBuffer }
}

/**
 * Calculate the file key from an entry given to saveFiles
 *
 * @param {import('../launcher/saveFiles').saveFilesEntry} entry - a savefiles entry
 * @param {Array<string>} fileIdAttributes - list of entry attributes which will be used to identify the entry in a unique way
 * @returns {string} - The resulting file key
 */
export const calculateFileKey = (entry, fileIdAttributes) =>
  fileIdAttributes
    .sort()
    .map(key => entry?.[key])
    .join('####')
