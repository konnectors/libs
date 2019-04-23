const bayes = require('classificator')

function createClassifier(parameters, options) {
  parameters.options = {
    ...parameters.options,
    ...options
  }

  const classifier = bayes.fromJson(parameters)

  return classifier
}

module.exports = {
  createClassifier
}
