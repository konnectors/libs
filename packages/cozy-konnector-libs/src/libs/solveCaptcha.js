/**
 * Use every possible means to solve a captcha. At the moment, Anticaptcha web service is used if
 * any related secret key is found in COZY_PARAMETERS environment variable.
 *
 * @module solveCaptcha
 */
const log = require('cozy-logger').namespace('solveCaptcha')
const errors = require('../helpers/errors')
const request = require('request-promise')
const sleep = require('util').promisify(global.setTimeout)

const connectorStartTime = Date.now()
const ms = 1
const s = 1000 * ms
const m = 60 * s

const DEFAULT_TIMEOUT = connectorStartTime + 3 * m // 3 minutes by default to let 1 min to the connector to fetch files

/**
 * Use every possible means to solve a captcha. At the moment, Anticaptcha web service is used if
 * any related secret key is found in COZY_PARAMETERS environment variable.
 * If you do not want to solve the captcha each time the connector is run, please also use
 * CookieKonnector which will help you save the session.
 *
 * Parameters:
 *
 * - `params` is an array of objects with any attributes with some mandatory attributes :
 *   + `type` (String): (default recaptcha) type of captcha to solve. can be "recaptcha" or "image" at the moment
 *   + `timeout` (Number): (default 3 minutes after now) time when the solver should stop trying to
 *   solve the captcha
 *   + `withFullSolution`(Boolean): (default false) Change the return to an object containing full solution
 *   + `websiteKey` (String): the key you can find on the targeted website (for recaptcha)
 *   + `websiteURL` (String): The URL of the page showing the captcha (for recaptcha)
 *   + `body` (String): The base64 encoded image (for image captcha)
 * Returns: Promise with the solved captcha response as a string
 *
 * @example
 *
 * ```javascript
 * const { solveCaptcha } = require('cozy-konnector-libs')
 *
 * const solvedKey = await solveCaptcha({
 *   websiteKey: 'the key in the webpage',
 *   websiteURL: 'http://quotes.toscrape.com/login',
 * })
 * // now use the solveKey to submit your form
 * ```
 * @alias module:solveCaptcha
 */
const solveCaptcha = async (params = {}) => {
  const defaultParams = {
    type: 'recaptcha',
    timeout: DEFAULT_TIMEOUT,
    withFullSolution: false
  }
  let solution
  let resultAttribute = 'gRecaptchaResponse'

  params = { ...defaultParams, ...params }

  const secrets = JSON.parse(process.env.COZY_PARAMETERS || '{}').secret

  if (params.type === 'recaptcha') {
    checkMandatoryParams(params, ['websiteKey', 'websiteURL'])
    const { websiteKey, websiteURL } = params
    solution = await solveWithAntiCaptcha(
      { websiteKey, websiteURL, type: 'NoCaptchaTaskProxyless' },
      params.timeout,
      secrets
    )
  } else if (params.type === 'recaptchav3') {
    checkMandatoryParams(params, [
      'websiteKey',
      'websiteURL',
      'pageAction',
      'minScore'
    ])
    const { websiteKey, websiteURL, pageAction, minScore } = params
    solution = await solveWithAntiCaptcha(
      {
        websiteKey,
        websiteURL,
        pageAction,
        minScore,
        type: 'RecaptchaV3TaskProxyless'
      },
      params.timeout,
      secrets
    )
  } else if (params.type === 'hcaptcha') {
    checkMandatoryParams(params, ['websiteKey', 'websiteURL'])
    const { websiteKey, websiteURL } = params
    solution = await solveWithAntiCaptcha(
      {
        websiteKey,
        websiteURL,
        type: 'HCaptchaTaskProxyless'
      },
      params.timeout,
      secrets
    )
  } else if (params.type === 'image') {
    checkMandatoryParams(params, ['body'])
    // Specific attribute to solve image, see API doc
    resultAttribute = 'text'
    solution = await solveWithAntiCaptcha(
      { body: params.body, type: 'ImageToTextTask' },
      params.timeout,
      secrets
    )
  }
  if (params.withFullSolution) {
    return solution
  } else {
    return solution[resultAttribute]
  }
}

function checkMandatoryParams(params = {}, mandatoryParams = []) {
  const keys = Object.keys(params)
  const missingKeys = mandatoryParams.filter(key => !keys.includes(key))
  if (missingKeys.length) {
    throw new Error(
      `${missingKeys.join(', ')} are mandatory to solve the captcha`
    )
  }
}

async function solveWithAntiCaptcha(
  taskParams,
  timeout = DEFAULT_TIMEOUT,
  secrets
) {
  const antiCaptchaApiUrl = 'https://api.anti-captcha.com'
  let gRecaptchaResponse = null
  const startTime = Date.now()

  // we try to solve the captcha with anticaptcha
  const clientKey = secrets.antiCaptchaClientKey
  if (clientKey) {
    log('debug', '  Creating captcha resolution task...')
    const task = await request.post(`${antiCaptchaApiUrl}/createTask`, {
      body: {
        clientKey,
        task: taskParams
      },
      json: true
    })
    if (task && task.taskId) {
      log('debug', `    Task id : ${task.taskId}`)
      while (!gRecaptchaResponse) {
        const resp = await request.post(`${antiCaptchaApiUrl}/getTaskResult`, {
          body: {
            clientKey,
            taskId: task.taskId
          },
          json: true
        })
        if (resp.status === 'ready') {
          if (resp.errorId) {
            log('error', `Anticaptcha error: ${JSON.stringify(resp)}`)
            throw new Error(errors.CAPTCHA_RESOLUTION_FAILED)
          }
          log('info', `  Found Recaptcha response : ${JSON.stringify(resp)}`)
          return resp.solution
        } else {
          log('debug', `    ${Math.round((Date.now() - startTime) / 1000)}s...`)
          if (Date.now() > timeout) {
            log('warn', `  Captcha resolution timeout`)
            throw new Error(errors.CAPTCHA_RESOLUTION_FAILED + '.TIMEOUT')
          }
          await sleep(10000)
        }
      }
    } else {
      log('warn', 'Could not create anticaptcha task')
      log('warn', JSON.stringify(task))
    }
  } else {
    log('warn', 'Could not find any anticaptcha secret key')
  }

  throw new Error(errors.CAPTCHA_RESOLUTION_FAILED)
}

module.exports = solveCaptcha
