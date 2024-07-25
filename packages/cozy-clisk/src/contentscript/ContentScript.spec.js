import { Q } from 'cozy-client'

import ContentScript, { PILOT_TYPE } from './ContentScript'

describe('ContentScript', () => {
  describe('saveFiles', () => {
    it('should call launcher saveFiles with given nominal options', async () => {
      const contentScript = new ContentScript()
      contentScript.bridge = {
        call: jest.fn(),
        emit: jest.fn()
      }
      contentScript.contentScriptType = PILOT_TYPE
      await contentScript.saveFiles(
        [
          {
            filename: 'testfile.pdf',
            fileurl: 'https://filedownload.com/file1'
          }
        ],
        { context: {} }
      )
      expect(contentScript.bridge.call).toHaveBeenCalledTimes(1)
      expect(contentScript.bridge.call).toHaveBeenCalledWith(
        'saveFiles',
        [
          {
            filename: 'testfile.pdf',
            fileurl: 'https://filedownload.com/file1'
          }
        ],
        { context: {} }
      )
    })
    it('should force file replace when shouldReplace file in options returns true', async () => {
      const contentScript = new ContentScript()
      contentScript.contentScriptType = PILOT_TYPE
      contentScript.bridge = {
        call: jest.fn(),
        emit: jest.fn()
      }
      await contentScript.saveFiles(
        [
          {
            filename: 'testfile.pdf',
            fileurl: 'https://filedownload.com/file1'
          },
          {
            filename: 'testfile2.pdf',
            fileurl: 'https://filedownload.com/file2'
          }
        ],
        {
          context: {},
          shouldReplaceFile: (file, entry) => {
            const result = entry.filename === 'testfile2.pdf'
            return result
          },
          fileIdAttributes: ['filename']
        }
      )
      expect(contentScript.bridge.call).toHaveBeenCalledTimes(1)
      expect(contentScript.bridge.call).toHaveBeenCalledWith(
        'saveFiles',
        [
          {
            filename: 'testfile.pdf',
            fileurl: 'https://filedownload.com/file1',
            forceReplaceFile: false
          },
          {
            filename: 'testfile2.pdf',
            fileurl: 'https://filedownload.com/file2',
            forceReplaceFile: true
          }
        ],
        {
          context: {},
          fileIdAttributes: ['filename']
        }
      )
    })
    it('should force file replace when shouldReplace file in entry returns true', async () => {
      const contentScript = new ContentScript()
      contentScript.contentScriptType = PILOT_TYPE
      contentScript.bridge = {
        call: jest.fn(),
        emit: jest.fn()
      }
      await contentScript.saveFiles(
        [
          {
            filename: 'testfile.pdf',
            fileurl: 'https://filedownload.com/file1',
            shouldReplaceFile: () => true
          },
          {
            filename: 'testfile2.pdf',
            fileurl: 'https://filedownload.com/file2'
          }
        ],
        {
          context: {},
          fileIdAttributes: ['filename']
        }
      )
      expect(contentScript.bridge.call).toHaveBeenCalledTimes(1)
      expect(contentScript.bridge.call).toHaveBeenCalledWith(
        'saveFiles',
        [
          {
            filename: 'testfile.pdf',
            fileurl: 'https://filedownload.com/file1',
            forceReplaceFile: true
          },
          {
            filename: 'testfile2.pdf',
            fileurl: 'https://filedownload.com/file2'
          }
        ],
        {
          context: {},
          fileIdAttributes: ['filename']
        }
      )
    })
  })
  describe('queryAll', () => {
    it('should convert the given query definition to a serializable object', async () => {
      const contentScript = new ContentScript()
      contentScript.contentScriptType = PILOT_TYPE
      contentScript.bridge = {
        call: jest.fn()
      }
      await contentScript.queryAll(
        Q('io.cozy.files').where({
          cozyMetadata: {
            sourceAccountIdentifier: 'testidentifier',
            createdByApp: 'testslug'
          }
        }),
        { as: 'testfilesrequest' }
      )
      expect(contentScript.bridge.call).toHaveBeenCalledWith(
        'queryAll',
        expect.objectContaining({
          selector: {
            cozyMetadata: {
              sourceAccountIdentifier: 'testidentifier',
              createdByApp: 'testslug'
            }
          }
        }),
        { as: 'testfilesrequest' }
      )
    })
  })
  describe('runInWorker', () => {
    const contentScript = new ContentScript()
    contentScript.contentScriptType = PILOT_TYPE
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
    contentScript.contentScriptType = PILOT_TYPE
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
  describe('shouldFullSync', () => {
    it('should force full sync if forceFullSync flag is activated', async () => {
      const contentScript = new ContentScript()
      contentScript.contentScriptType = PILOT_TYPE

      const options = {
        flags: {
          'clisk.force-full-sync': true
        },
        trigger: {
          current_state: {
            last_execution: '2024-07-24T14:55:57.83761233+02:00',
            last_failure: '2024-07-23T14:55:57.83761233+02:00',
            last_success: '2024-07-24T14:55:57.83761233+02:00'
          }
        }
      }
      const result = await contentScript.shouldFullSync(options)
      expect(result).toEqual({
        forceFullSync: true,
        distanceInDays: 0
      })
    })
    it('should force full sync if it is the first execution', async () => {
      const contentScript = new ContentScript()
      contentScript.contentScriptType = PILOT_TYPE

      const options = {
        flags: {
          'clisk.force-full-sync': false
        },
        trigger: {
          current_state: {}
        }
      }
      const result = await contentScript.shouldFullSync(options)
      expect(result).toEqual({
        forceFullSync: true,
        distanceInDays: 0
      })
    })
    it('should force full sync if the last execution failed', async () => {
      const contentScript = new ContentScript()
      contentScript.contentScriptType = PILOT_TYPE

      const options = {
        flags: {
          'clisk.force-full-sync': false
        },
        trigger: {
          current_state: {
            last_execution: '2024-07-24T14:55:57.83761233+02:00',
            last_failure: '2024-07-24T14:55:57.83761233+02:00',
            last_success: '2024-07-23T14:55:57.83761233+02:00'
          }
        }
      }
      const result = await contentScript.shouldFullSync(options)
      expect(result).toEqual({
        forceFullSync: true,
        distanceInDays: 0
      })
    })
    it('should not force full sync in nominal case', async () => {
      const contentScript = new ContentScript()
      contentScript.contentScriptType = PILOT_TYPE

      const options = {
        flags: {
          'clisk.force-full-sync': false
        },
        trigger: {
          current_state: {
            last_execution: '2024-07-24T14:55:57.83761233+02:00',
            last_failure: '2024-07-23T14:55:57.83761233+02:00',
            last_success: '2024-07-24T14:55:57.83761233+02:00'
          }
        }
      }
      const result = await contentScript.shouldFullSync(options)
      expect(result).toEqual({
        forceFullSync: false,
        distanceInDays: 0
      })
    })
  })
})
