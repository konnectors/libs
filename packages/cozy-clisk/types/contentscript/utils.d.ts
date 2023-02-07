/**
 * Convert a blob object to a base64 uri
 *
 * @param {Blob} blob : blob object
 * @returns {Promise.<string|ArrayBuffer>} : base64 form of the blob
 */
export function blobToBase64(blob: Blob): Promise<string | ArrayBuffer>;
