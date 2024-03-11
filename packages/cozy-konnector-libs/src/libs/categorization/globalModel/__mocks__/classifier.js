const bayes = require('classificator')

const toLearn = require('./set_label_cat.json')

const createClassifier = jest.fn((parameters, options) => {
  const classifier = bayes(options)

  for (const { label, category } of toLearn) {
    classifier.learn(label, category)
  }

  return classifier
})

module.exports = {
  createClassifier
}
