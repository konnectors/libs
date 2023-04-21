/**
 * Convert a blob object to a base64 uri
 *
 * @param {Blob} blob : blob object
 * @returns {Promise.<string>} : base64 form of the blob
 */
export async function blobToBase64(blob) {
  const reader = new window.FileReader()
  await new Promise((resolve, reject) => {
    reader.onload = resolve
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
  return reader.result
}

/**
 * Convert a string function to the corresponding function.
 *
 * @param {String} fnString - function string to convert
 *
 * @returns {Function} - the resulting function
 */
export function deserializeStringFunction(fnString) {
  return eval('(' + fnString.trim() + ')')
}

/**
 * Calls and awaits the given string function with given arguments
 *
 * @param {String} fnString - function string to convert
 *
 * @returns {Promise<any>} - the result of the execution of the string function
 */
export async function callStringFunction(fnString, ...args) {
  const fn = deserializeStringFunction(fnString)
  return await fn(...args)
}
