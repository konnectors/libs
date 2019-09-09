class TestBaseKonnector {
  getAccount() {
    throw new Error('should not be thrown')
  }
  initAttributes() {
    throw new Error('should not be thrown')
  }
}
module.exports = {
  BaseKonnector: TestBaseKonnector,
  mkdirp: jest.fn()
}
