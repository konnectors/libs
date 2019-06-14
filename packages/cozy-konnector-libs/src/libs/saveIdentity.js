 /**
 * Helper to set or merge io.cozy.identities
 * See https://github.com/cozy/cozy-doctypes/blob/master/docs/io.cozy.identities.md
 *
 * @module saveIdentity
 */

const log = require('cozy-logger').namespace('saveIdentity')
const updateOrCreate = require('./updateOrCreate')
const { getCozyMetadata } = require('./manifest')

/**
 * Set or merge a io.cozy.identities
 *
 * You need full permission for the doctype io.cozy.identities in your
 * manifest, to be able to use this function.
 *
 * Parameters:
 *
 * * `contact` (object): the identity to create/update as an object io.cozy.contacts
 * * `accountIdentifier` (string): a string that represent the account use, if available fields.login
 *
 * ```javascript
 * const { saveIdentity } = require('cozy-konnector-libs')
 * const identity =
 *   {
 *     name: 'toto',
 *     email: { 'address': 'toto@example.com' }
 *   }
 *
 * return saveIdentity(identity, fields.login)
 * ```
 *
 * @alias module:saveIdentity
 */

module.exports = async (contact, accountIdentifier) => {
  if(accountIdentifier == null) {
    log('warn', "Can't set identity as no accountIdentifier was provided")
    return
  }
  if(contact == null) {
    log('warn', "Can't set identity as no contact was provided")
    return
  }
  // Format contact if needed
  if (contact.phone && contact.phone.number) {
    contact.phone.number = formatPhone(contact.phone.number)
  }
  if (contact.address && contact.address.formattedAddress) {
    contact.address.formattedAddress = formatAddress(contact.address.formattedAdress)
  }

  const identity = {
    'identifier': accountIdentifier,
    'contact': contact,
    'cozyMetadata': getCozyMetadata()
  }

  await updateOrCreate(
    [identity],
    'io.cozy.identities',
    ['identifier', 'cozyMetadata.createdByApp']
  )
  return
}


/* Remove html and cariage return in address
*/
function formatAddress(address) {
  return address
    .replace(/<[^>]*>/g, '')  // Remove all html Tag
    .replace(/\r\n|[\n\r]/g, ' ')  // Remove all kind of return character
}


/* Replace all characters in a phone number except '+' or digits
*/
function formatPhone(phone) {
  return phone.replace(/[^\d.+]/g, '')
}
