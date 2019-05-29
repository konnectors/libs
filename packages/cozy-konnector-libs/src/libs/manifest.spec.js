const manifest = require('./manifest')

describe('manifest.getCozyMetadata', () => {
  let now
  beforeEach(() => {
    manifest.setManifest({
      slug: 'testapp',
      version: '0.0.1'
    })
    now = new Date('2019-01-01').valueOf()
    jest.spyOn(global.Date, 'now').mockImplementationOnce(() => now)
  })

  it('should return proper defaults', () => {
    expect(manifest.getCozyMetadata()).toEqual({
      createdAt: new Date(now),
      doctypeVersion: 1,
      metadataVersion: 1,
      createdByApp: 'testapp',
      createdByAppVersion: '0.0.1',
      updatedAt: new Date(now),
      updatedByApps: [
        { slug: 'testapp', date: new Date(now), version: '0.0.1' }
      ]
    })
  })

  it('should overload exsting data on the same slug', () => {
    expect(
      manifest.getCozyMetadata({
        doctypeVersion: 2,
        updatedByApps: [
          { slug: 'otherapp' },
          { slug: 'testapp', date: new Date(), version: '1.1.1' }
        ]
      })
    ).toEqual({
      createdAt: new Date(now),
      doctypeVersion: 2,
      metadataVersion: 1,
      createdByApp: 'testapp',
      createdByAppVersion: '0.0.1',
      updatedAt: new Date(now),
      updatedByApps: [
        { slug: 'otherapp' },
        { slug: 'testapp', date: new Date(now), version: '0.0.1' }
      ]
    })
  })
})
