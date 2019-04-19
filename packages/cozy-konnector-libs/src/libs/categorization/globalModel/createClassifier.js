const bayes = require('classificator')

const createClassifier = (data = {}, options = {}) => {
  data.options = {
    ...data.options,
    ...options
  }

  const classifier = bayes.fromJson(data)

  // Display classifier to compare with python file
  // console.log('classifier', classifier.toJson())

  return classifier
}

module.exports = createClassifier
