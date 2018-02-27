const DOMAIN_REGEXP = /^https?:\/\/([a-zA-Z0-9-.]+)(?::\d{2,5})?\/?$/

const getDomain = cozyUrl => {
  cozyUrl = cozyUrl || process.env.COZY_URL
  return cozyUrl.match(DOMAIN_REGEXP)[1].split('.').slice(-2).join('.')
}

const getInstance = cozyUrl => {
  cozyUrl = cozyUrl || process.env.COZY_URL
  return cozyUrl.match(DOMAIN_REGEXP)[1].split('.').slice(-3).join('.')
}

module.exports = {getDomain, getInstance}
