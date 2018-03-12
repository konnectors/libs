import { prodFormat } from './log-formats'

describe('Production log formater', () => {
  it('should output any message string unchanged', () => {
    expect(JSON.parse(prodFormat('info', 'helloWorl$#')).message).toEqual('helloWorl$#')
    expect(JSON.parse(prodFormat('critical', '-------')).message).toEqual('-------')
  })
  it('should convert critical array message properly', () => {
    expect(JSON.parse(prodFormat('critical', [])).message).toEqual('')
    expect(JSON.parse(prodFormat('critical', ['test'])).message).toEqual('test')
    expect(JSON.parse(prodFormat('critical', ['te-st'])).message).toEqual('test')
    expect(JSON.parse(prodFormat('critical', ['te-st', 'coucou'])).message).toEqual('test-coucou')
    expect(JSON.parse(prodFormat('critical', ['te-st', 2, 'coucou'])).message).toEqual('test-coucou')
    expect(JSON.parse(prodFormat('critical', ['te-st', 'bonjour', 'coucou'])).message).toEqual('test-bonjour-coucou')
  })
})
