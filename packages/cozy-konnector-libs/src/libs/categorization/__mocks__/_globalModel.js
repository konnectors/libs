const bayes = require('classificator')

const toLearn = require('./set_label_cat.json')

const globalModel = jest.fn()

const createClassifier = (data, options = {}) => {
  const classifier = bayes(options)

  for (const { label, category } of toLearn) {
    classifier.learn(label, category)
  }

  return classifier
}

module.exports = {
  globalModel,
  createClassifier
}
