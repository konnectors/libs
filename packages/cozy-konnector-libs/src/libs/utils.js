const cozyClient = require('./cozyclient')

const fetchAll = async doctype => {
  const res = await cozyClient.fetchJSON(
    'GET',
    `/data/${doctype}/_all_docs?include_docs=true`
  )
  return res.rows
    .filter(doc => doc.id.indexOf('_design') === -1)
    .map(doc => doc.doc)
}

module.exports = {
  fetchAll
}
