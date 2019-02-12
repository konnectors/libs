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
const TIMEOUT = connectorStartTime + 4 * 60 * 1000 // 4 minutes by default since the stack allows 5 minutes

/**
 * Use every possible means to solve a captcha. At the moment, Anticaptcha web service is used if
 * any related secret key is found in COZY_PARAMETERS environment variable.
 * If you do not want to solve the captcha each time the connector is run, please also use
 * CookieKonnector which will help you save the session.
 *
 * Parameters:
 *
 * - `params` is an array of objects with any attributes with some mandatory attributes :
 *   + `type` (String): (default recaptcha) type of captcha to solve
 *   + `timeout` (Number): (default 4 minutes after now) time when the solver should stop trying to
 *   solve the captcha
 *   + `websiteKey` (String): the key you can find on the targeted website
 *   + `websiteURL` (String): The URL of the page showing the captcha
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
 *
 * @alias module:solveCaptcha
 */
module.exports = async (params = {}) => {
  const defaultParams = {
    type: 'recaptcha',
    timeout: TIMEOUT
  }

  params = { ...defaultParams, params }

  if (params.type === 'recaptcha') {
    const secrets = JSON.parse(process.env.COZY_PARAMETERS || '{}').secret
    const startTime = Date.now()
    checkMandatoryParams(params, ['websiteKey', 'websiteURL'])
    const antiCaptchaApiUrl = 'https://api.anti-captcha.com'
    let gRecaptchaResponse = null

    // we try to solve the captcha with anticaptcha
    const clientKey = secrets.antiCaptchaClientKey
    if (clientKey) {
      log('info', '  Creating captcha resolution task...')
      const task = await request.post(`${antiCaptchaApiUrl}/createTask`, {
        body: {
          clientKey,
          task: {
            type: 'NoCaptchaTaskProxyless',
            websiteURL: params.websiteURL,
            websiteKey: params.websiteKey
          }
        },
        json: true
      })
      if (task && task.taskId) {
        log('info', `    Task id : ${task.taskId}`)
        while (!gRecaptchaResponse) {
          const resp = await request.post(
            `${antiCaptchaApiUrl}/getTaskResult`,
            {
              body: {
                clientKey,
                taskId: task.taskId
              },
              json: true
            }
          )
          if (resp.status === 'ready') {
            log(
              'info',
              `  Found Recaptcha response : ${resp.solution.gRecaptchaResponse}`
            )
            return resp.solution.gRecaptchaResponse
          } else {
            log(
              'info',
              `    ${Math.round((Date.now() - startTime) / 1000)}s...`
            )
            if (Date.now() > params.timeout) {
              log('warn', `  Captcha resolution timeout`)
              throw new Error(errors.CHALLENGE_ASKED)
            }
            await sleep(10000)
          }
        }
      }
    } else {
      log('warn', 'Could not find any anticaptcha secret key')
    }
  }

  throw new Error(errors.CHALLENGE_ASKED)
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
