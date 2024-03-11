/* eslint no-console: off */

import MicroEE from 'microee'

import { blobToBase64 } from './utils'

/**
 * Intercept any xhr or fetch request corresponding to the given interception list
 */
class RequestInterceptor {
  /**
   * @function Object() { [native code] }
   * @param {Array<InterceptionDocument>} interceptions - the list of url to intercept
   */
  constructor(interceptions) {
    this.interceptions = interceptions
    this.savedSetRequestHeader =
      window.XMLHttpRequest.prototype.setRequestHeader
    this.savedOpen = window.XMLHttpRequest.prototype.open
    this.savedFetch = window.fetch
  }

  /**
   * Restore original request function to default values
   */
  restore() {
    window.XMLHttpRequest.prototype.setRequestHeader =
      this.savedSetRequestHeader
    window.XMLHttpRequest.prototype.open = this.savedOpen
    window.fetch = this.savedFetch
  }

  /**
   * Init the replacemenet of xhr and fetch function to be able to intercept requests
   */
  init() {
    try {
      const self = this
      window.XMLHttpRequest.prototype.setRequestHeader = function (key, value) {
        try {
          const newValue = this._requestHeaders[key]
            ? (this._requestHeaders[key] += ', ' + value)
            : value
          this._requestHeaders[key] = newValue
          return self.savedSetRequestHeader.apply(
            this,
            [].slice.call(arguments)
          )
        } catch (err) {
          this.log(
            'error',
            '❌❌❌ xhr setRequestHeader interception error ' + err.message
          )
        }
      }
      window.XMLHttpRequest.prototype.open = function (method, url) {
        try {
          const response = this
          response._requestHeaders = {}
          response.addEventListener('readystatechange', function () {
            if (response.readyState === 4) {
              const responseHeaders = {}
              const allResponseHeaders = response.getAllResponseHeaders()
                ? response.getAllResponseHeaders().split('\r\n')
                : []
              for (const header of allResponseHeaders) {
                const [key, value] = header.split(': ')
                responseHeaders[key] = value
              }
              self.serializeAndEmitResponse({
                method,
                url,
                response,
                responseHeaders,
                requestHeaders: response._requestHeaders
              })
            }
            return response
          })
          return self.savedOpen.apply(response, [].slice.call(arguments))
        } catch (err) {
          this.log('error', '❌❌❌ xhr interception error ' + err.message)
        }
      }
      window.fetch = async function (...args) {
        const response = await self.savedFetch.apply(window, args)
        try {
          const [input, options] = args
          const url =
            typeof input === 'string' ? input : input?.url || input?.toString()
          const method = options?.method || input?.method || 'GET'
          const responseHeaders = {}
          for (const [key, value] of response.headers.entries()) {
            responseHeaders[key] = value
          }
          self.serializeAndEmitResponse({
            method,
            url,
            response,
            responseHeaders,
            requestHeaders: options?.headers
          })
          return response
        } catch (err) {
          this.log('error', '❌❌❌ fetch interception error ' + err.message)
        }
      }
    } catch (err) {
      this.log('error', '❌❌❌ interceptor init error ' + err.message)
    }
  }
  /**
   * Serialize the intercepted response according to the "serialize" attribute given in the
   * interception list and emit it as a "response" event
   *
   * @param {Response} resp - HTTP response
   */
  async serializeAndEmitResponse(resp) {
    const interception = this.interceptions.find(doc =>
      resp.method === doc.method && doc.exact
        ? resp.url === doc.url
        : resp.url.includes(doc.url)
    )
    if (!interception) return

    if (interception.label) {
      this.log(
        'warn',
        `RequestInterceptor: interception.label is deprecated, you should use interception.identifier`
      )
    }
    resp.identifier = interception.identifier || interception.label

    // response serialization, to be able to transfer to the pilot
    if (interception.serialization === 'json') {
      if (resp.response instanceof Response) {
        resp.response = await resp.response.clone().json()
      } else {
        resp.response = JSON.parse(resp.response.responseText)
      }
    } else if (interception.serialization === 'text') {
      if (resp.response instanceof Response) {
        resp.response = await resp.response.clone().text()
      } else {
        resp.response = resp.response.responseText
      }
    } else if (interception.serialization === 'dataUri') {
      if (resp.response instanceof Response) {
        resp.response = blobToBase64(await resp.response.clone().blob())
      } else {
        resp.response = blobToBase64(resp.response.response)
      }
    } else {
      this.log(
        'error',
        '❌❌❌ wrong serialization method : ' + interception.serialization
      )
    }
    this.emit('response', resp)
    this.log(
      'debug',
      `RequestInterceptor: intercepted ${resp.method} ${resp.url} response`
    )
  }

  setLogger(logger) {
    this.log = logger
  }
}

MicroEE.mixin(RequestInterceptor)

export default RequestInterceptor

/**
 * @typedef EmittedResponse
 * @property {string} [label] - a name given to the interception (deprecated in favor of identifier)
 * @property {string} identifier - an identifier given to the interception
 * @property {'GET'|'POST'|'PUT'|'DELETE'} method - the method of the intercepted request
 * @property {string} url - the url intercepted request url
 * @property {Response} response - raw response of the intercepted request
 * @property {object} responseHeaders - response headers
 * @property {object} requestHeaders - request headers
 */

/**
 * @typedef InterceptionDocument
 * @property {string} [label] - a name given to the interception, will be found in the response later (deprecated in favor of identifier)
 * @property {string} identifier - an identifier given to the interception
 * @property {string} url - the url to intercept
 * @property {'GET'|'POST'|'PUT'|'DELETE'} method - the method of the url to intercept
 * @property {boolean} exact - true if the intercepted url must exactly correspond to the given url
 */
