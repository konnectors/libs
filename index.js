module.exports = {
  baseKonnector: require('./base_konnector'),
  cozyClient: require('./cozyclient'),
  fetcher: require('./fetcher'),
  filterExisting: require('./filter_existing'),
  manifest: require('./manifest'),
  naming: require('./naming'),
  saveDateAndFile: require('./save_data_and_file'),
  model: {
    bill: require('./models/bill'),
    file: require('./models/file'),
    folder: require('./models/folder')
  }
}
