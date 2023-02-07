import { ChildHandshake, Connection } from 'post-me'
import ReactNativeWebviewMessenger from './ContentScriptMessenger'
import { Bridge, InitObject } from './bridgeInterfaces'

/**
 * Bridge to the Launcher object via post-me
 */
export default class LauncherBridge implements Bridge {
  localWindow: any
  connection: Connection
  localHandle: any
  remoteHandle: any
  /**
   * Init the window which will be used to communicate with the launcher
   *
   * @param {object} options             : option object
   * @param {object} options.localWindow : The window used to communicate with the launcher
   */
  constructor({ localWindow }) {
    this.localWindow = localWindow
  }

  async init({ exposedMethods }: InitObject) {
    const messenger = new ReactNativeWebviewMessenger({
      localWindow: this.localWindow
    })
    this.connection = await ChildHandshake(messenger, exposedMethods)
    this.localHandle = this.connection.localHandle()
    this.remoteHandle = this.connection.remoteHandle()
  }
  async call(method, ...args) {
    return this.remoteHandle.call(method, ...args)
  }

  emit(eventName, ...args) {
    this.localHandle.emit(eventName, ...args)
  }

  addEventListener(remoteEventName, listener) {
    this.remoteHandle.addEventListener(remoteEventName, listener)
  }

  removeEventListener(remoteEventName, listener) {
    this.remoteHandle.removeEventListener(remoteEventName, listener)
  }
}
