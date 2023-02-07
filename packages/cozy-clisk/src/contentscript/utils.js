/**
 * Convert a blob object to a base64 uri
 *
 * @param {Blob} blob : blob object
 * @returns {Promise.<string|ArrayBuffer>} : base64 form of the blob
 */
async function blobToBase64(blob) {
  const reader = new window.FileReader()
  await new Promise((resolve, reject) => {
    reader.onload = resolve
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
  return reader.result
}

export { blobToBase64 }
