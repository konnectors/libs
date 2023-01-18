// @ts-check
import { MessengerInterface } from './bridgeInterfaces'

/**
 * post-me messenger implementation for a content script implanted in a react native webview
 */
export default class ReactNativeWebviewMessenger extends MessengerInterface {
  /**
   * Init the window which will be used to post messages and listen to messages
   *
   * @param  {object} options             : options object
   * @param  {object} options.localWindow : The window object
   */
  constructor({ localWindow }) {
    super()
    this.localWindow = localWindow
  }
  postMessage(message) {
    this.localWindow.ReactNativeWebView.postMessage(JSON.stringify(message))
  }
  addMessageListener(listener) {
    const outerListener = event => {
      listener(event)
    }

    this.localWindow.addEventListener('message', outerListener)

    const removeMessageListener = () => {
      this.localWindow.removeEventListener('message', outerListener)
    }

    return removeMessageListener
  }
}
