import { dataUriToArrayBuffer } from './utils'

describe('dataUriToArrayBuffer', () => {
  it('should return an ArrayBuffer when proper dataURI is given', () => {
    const result = dataUriToArrayBuffer(`data:test;base64,coucou`)
    expect(result.arrayBuffer).toBeInstanceOf(ArrayBuffer)
    expect(result.contentType).toEqual('test')
  })
  it('should throw the proper error when invalid dataURI is given', () => {
    expect(() =>
      dataUriToArrayBuffer('test')
    ).toThrowErrorMatchingInlineSnapshot(
      `"dataUriToArrayBuffer: dataURI is malformed. Should be in the form data:...;base64,..."`
    )
  })
})
