// @ts-check
import Minilog from '@cozy/minilog'

import { Q } from 'cozy-client'
const log = Minilog('saveIdentity')

/**
 * Set or merge a io.cozy.identities
 *
 * You need full permission for the doctype io.cozy.identities in your
 * manifest, to be able to use this function.
 *
 * @param {object} contactOrIdentity : the identity to create/update as an object io.cozy.contacts
 * @param {string} accountIdentifier : a string that represent the account use
 * @param {object} options : options object
 * @param {import('cozy-client/types/CozyClient').default} options.client - CozyClient instance
 * @param {boolean} [options.merge] - Merge the identity with the previous one (default false)
 * ```javascript
 * const identity =
 *   {
 *     name: 'toto',
 *     email: { 'address': 'toto@example.com' }
 *   }
 *
 * await saveIdentity(identity, identity.email.address)
 * ```
 */

export default async (contactOrIdentity, accountIdentifier, options) => {
  if (!options) {
    log.error('saveIdentity: options is required')
    return
  }
  if (accountIdentifier == null) {
    log.warn("Can't set identity as no accountIdentifier was provided")
    return
  }

  if (contactOrIdentity == null) {
    log.warn("Can't set identity as no identity was provided")
    return
  }

  // we suppose here that an identity always contains at least some contact information
  const isIdentity = contactOrIdentity.contact
  if (!isIdentity) {
    log.warn(
      'passing a io.cozy.contacts object is deprected, please pass a full identity object'
    )
  }
  const identity = isIdentity
    ? contactOrIdentity
    : { contact: contactOrIdentity }
  identity.identifier = accountIdentifier

  identity.contact = trimProperties(formatIdentityContact(identity.contact))

  // Format contact if needed
  if (identity.contact.phone) {
    identity.contact.phone = formatPhone(identity.contact.phone)
  }
  if (identity.contact.address) {
    identity.contact.address = formatAddress(identity.contact.address)
  }

  const client = options.client

  const { data: existingResult } = await client.query(
    Q('io.cozy.identities')
      .where({
        identifier: accountIdentifier,
        'cozyMetadata.createdByApp': client.appMetadata.slug
      })
      .indexFields(['identifier', 'cozyMetadata.createdByApp'])
  )
  const existingSameIdentity = existingResult?.[0] || {}

  if (existingSameIdentity) {
    if (options.merge) {
      await client.save({
        ...existingSameIdentity,
        ...identity,
        _type: 'io.cozy.identities'
      })
    } else {
      await client.save({
        ...identity,
        _id: existingSameIdentity._id,
        _rev: existingSameIdentity._rev,
        cozyMetadata: {
          ...existingSameIdentity.cozyMetadata,
          sourceAccountIdentifier: accountIdentifier
        },
        _type: 'io.cozy.identities'
      })
    }
  } else {
    await client.save({
      ...identity,
      _type: 'io.cozy.identities'
    })
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

export function formatIdentityContact(contactToFormat) {
  const contact = { ...contactToFormat }
  if (contact.phone) {
    if (!Array.isArray(contact.phone)) {
      log(
        'warn',
        'formatIdentityContact Phone is not an array, you should fix it'
      )
      contact.phone = [
        {
          number: contact.phone
        }
      ]
    }
    contact.phone = formatPhone(contact.phone)
  }

  if (contact.address) {
    if (!Array.isArray(contact.address)) {
      log(
        'warn',
        'formatIdentityContact Address is not an array, you should fix it'
      )
      contact.address = [
        {
          formattedAddress: contact.address
        }
      ]
    }
    contact.address = formatAddress(contact.address)
  }
  if (contact.email) {
    if (!Array.isArray(contact.email)) {
      log(
        'warn',
        'formatIdentityContact Email is not an array, you should fix it'
      )
      contact.email = [
        {
          address: contact.email
        }
      ]
    }
  }
  return contact
}

export function trimProperties(obj) {
  for (let key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key].trim()
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      trimProperties(obj[key])
    }
  }
  return obj
}
