const fetchParameters = require('./fetchParameters')
const cozyClient = require('../../cozyclient')

jest.mock('../../cozyclient')

it('should fetch the global model parameters from stack', async () => {
  await fetchParameters()

  expect(cozyClient.fetchJSON).toHaveBeenCalledWith(
    'GET',
    '/remote/assets/bank_classifier_nb_and_voc'
  )
})

it('should throw an error if it failed', () => {
  cozyClient.fetchJSON.mockRejectedValueOnce()
  expect(fetchParameters()).rejects.toThrow()
})
