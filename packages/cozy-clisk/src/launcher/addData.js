// @ts-check
import Minilog from '@cozy/minilog'
const log = Minilog('addData')

/**
 * Saves the data into the cozy blindly without check.
 *
 * You need at least the `POST` permission for the given doctype in your manifest, to be able to
 * use this function.
 *
 * @param {Array} entries : an array of objects corresponding to the data you want to save in the cozy
 * @param {string} doctype : the doctype where you want to save data (ex: 'io.cozy.bills')
 * @param {object} options : options object
 * @param {import('cozy-client/types/CozyClient').default} options.client CozyClient instance
 * @param {string} options.sourceAccountIdentifier : unique identifier of the user website account
 */
export default async (entries, doctype, options) => {
  const client = options?.client
  if (!client) {
    throw new Error('addData: called without any client in options')
  }

  if (!options?.sourceAccountIdentifier) {
    throw new Error(
      'addData: called without any sourceAccountIdentifier in options'
    )
  }

  const result = []
  for (const entry of entries) {
    log.debug('Adding entry', entry)
    const doc = await client.save({
      ...entry,
      _type: doctype,
      sourceAccountIdentifier: options.sourceAccountIdentifier
    })
    const dbEntry = doc.data
    entry._id = dbEntry._id
    result.push(dbEntry)
  }
  return result
}
