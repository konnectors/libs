const cozyClient = require('../../cozyclient')
const logger = require('cozy-logger')

const log = logger.namespace('global-categorization-model/fetchParameters')
const PARAMETERS_NOT_FOUND = 'Classifier files is not configured.'

const fetchParameters = async () => {
  try {
    const parameters = await cozyClient.fetchJSON(
      'GET',
      '/remote/assets/bank_classifier_nb_and_voc'
    )
    return parameters
  } catch (e) {
    log('info', e.message)
    throw new Error(PARAMETERS_NOT_FOUND)
  }
}

module.exports = fetchParameters
