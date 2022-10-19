/**
 * Helper to set or merge io.cozy.identities
 * See https://github.com/cozy/cozy-doctypes/blob/master/docs/io.cozy.identities.md
 *
 * @module saveIdentity
 */

const log = require('cozy-logger').namespace('saveIdentity')
const updateOrCreate = require('./updateOrCreate')
const cozyClient = require('./cozyclient')
const manifest = require('./manifest')
// A implicit import of Q cause a weird failing test
const { Q } = require('cozy-client/dist/queries/dsl')

/**
 * Set or merge a io.cozy.identities
 *
 * You need full permission for the doctype io.cozy.identities in your
 * manifest, to be able to use this function.
 * Parameters:
 *
 * `identity` (object): the identity to create/update as an io.cozy.identities object
 * `accountIdentifier` (string): a string that represent the account use, if available fields.login
 * `options` (object): options which will be given to updateOrCreate directly :
 *   + `sourceAccount` (String): id of the source account
 *   + `sourceAccountIdentifier` (String): identifier unique to the account targetted by the connector. It is the login most of the time
 *
 *
 * ```javascript
 * const { saveIdentity } = require('cozy-konnector-libs')
 * const identity =
 *   {
 *     contact: {
 *       name: 'toto',
 *       email: { 'address': 'toto@example.com' }
 *     }
 *   }
 *
 * return saveIdentity(identity, fields.login)
 * ```
 *
 * @alias module:saveIdentity
 */

const saveIdentity = async (
  contactOrIdentity,
  accountIdentifier,
  options = {}
) => {
  log('debug', 'saving user identity')
  if (accountIdentifier == null) {
    log('warn', "Can't set identity as no accountIdentifier was provided")
    return
  }

  if (contactOrIdentity == null) {
    log('warn', "Can't set identity as no identity was provided")
    return
  }

  // we suppose here that an identity always contains at least some contact information
  const isIdentity = contactOrIdentity.contact
  if (!isIdentity) {
    log(
      'warn',
      'passing a io.cozy.contacts object is deprected, please pass a full identity object'
    )
  }
  const identity = isIdentity
    ? contactOrIdentity
    : { contact: contactOrIdentity }
  identity.identifier = accountIdentifier

  // Format contact if needed
  if (identity.contact.phone) {
    identity.contact.phone = formatPhone(identity.contact.phone)
  }
  if (identity.contact.address) {
    identity.contact.address = formatAddress(identity.contact.address)
  }

  if (options.merge == false) {
    // Using cozy client in a none merging strategy here.
    const newClient = cozyClient.new
    const { data: existingIdentity } = await newClient.query(
      Q('io.cozy.identities')
        .where({
          cozyMetadata: { createdByApp: manifest.data.slug },
          identifier: accountIdentifier
        })
        .indexFields(['identifier', 'cozyMetadata.createdByApp'])
    )

    if (existingIdentity.length > 1) {
      log('warn', 'Multiple identity for same identifier')
    }

    if (existingIdentity.length >= 1) {
      log('debug', 'Updating existing identity')
      let newIdentity = existingIdentity[0]
      newIdentity.contact = identity.contact
      await newClient.save({
        ...newIdentity,
        _type: 'io.cozy.identities'
      })
    } else {
      try {
        await newClient.save({
          ...identity,
          _type: 'io.cozy.identities'
        })
      } catch (e) {
        log('error', e)
      }
    }
  } else {
    await updateOrCreate(
      [identity],
      'io.cozy.identities',
      ['identifier', 'cozyMetadata.createdByApp'],
      { ...options, sourceAccountIdentifier: accountIdentifier }
    )
  }
  return
}

/* Remove html and cariage return in address
 */
function formatAddress(address) {
  for (const element of address) {
    if (element.formattedAddress) {
      element.formattedAddress = element.formattedAddress
        .replace(/<[^>]*>/g, '') // Remove all html Tag
        .replace(/\r\n|[\n\r]/g, ' ') // Remove all kind of return character
      address[address.indexOf(element)] = element
    }
  }
  return address
}

/* Replace all characters in a phone number except '+' or digits
 */
function formatPhone(phone) {
  for (const element of phone) {
    if (element.number) {
      element.number = element.number.replace(/[^\d.+]/g, '')
      phone[phone.indexOf(element)] = element
    }
  }
  return phone
}

module.exports = saveIdentity
