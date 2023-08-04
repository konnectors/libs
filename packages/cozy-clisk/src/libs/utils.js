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
  const [contentType, base64String] = dataURI
    .match(/^data:(.*);base64,(.*)$/)
    .slice(1)
  const byteString = global.atob(base64String)
  const arrayBuffer = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(arrayBuffer)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  return { contentType, arrayBuffer }
}
