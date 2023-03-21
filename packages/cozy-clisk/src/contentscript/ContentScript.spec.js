import ContentScript, { PILOT_TYPE } from './ContentScript'

describe('ContentScript', () => {
  describe('runInWorker', () => {
    const contentScript = new ContentScript()
    contentScript.setContentScriptType(PILOT_TYPE)
    it('should throw an error met in the worker', async () => {
      contentScript.bridge = {
        call: jest.fn().mockRejectedValue(new Error('worker error'))
      }

      await expect(() => contentScript.runInWorker('test')).rejects.toThrow(
        'worker error'
      )
    })
  })

  describe('runInWorkerUntilTrue', () => {
    const contentScript = new ContentScript()
    contentScript.setContentScriptType(PILOT_TYPE)
    jest.spyOn(contentScript, 'runInWorker')
    contentScript.tocall = jest.fn()

    it('should resolve with result of the specified method returns truthy value', async () => {
      contentScript.runInWorker.mockResolvedValueOnce('result')
      const result = await contentScript.runInWorkerUntilTrue({
        method: 'tocall'
      })
      expect(result).toEqual('result')
    })
    it('should resolve only once the specified method returns truthy value', async () => {
      contentScript.runInWorker
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce('result last')
      const result = await contentScript.runInWorkerUntilTrue({
        method: 'tocall'
      })
      expect(result).toEqual('result last')
    })

    it('should reject when timeout is expired', async () => {
      contentScript.runInWorker.mockResolvedValue(false)
      await expect(
        contentScript.runInWorkerUntilTrue({ method: 'tocall', timeout: 1 })
      ).rejects.toThrow('Timeout error')
    })
  })
})
