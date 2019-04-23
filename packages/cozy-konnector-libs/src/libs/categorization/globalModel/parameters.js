const cozyClient = require('../../cozyclient')

async function fetchParameters() {
  const parameters = await cozyClient.fetchJSON(
    'GET',
    '/remote/assets/bank_classifier_nb_and_voc'
  )
  return parameters
}

module.exports = {
  fetchParameters
}
