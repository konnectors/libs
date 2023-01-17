/* eslint-disable no-unused-vars */
/**
 * @typedef PostMeConnection
 * @property {Function} localHandle  : get handle to the local end of the connection
 * @property {Function} remoteHandle : get handle to the remote end of the connection
 * @property {Function} close        : stop listening to incoming message from the other side
 */

/**
 * All bridges are supposed to implement this interface
 */
export class Bridge {
  /**
   * Initialize the communication between the parent and the child via post-me protocol
   * https://github.com/alesgenova/post-me
   *
   * @param  {object} options                             : Options object
   * @param  {object} options.root                        : The object which will contain the exposed method names
   * @param  {Array.<string>} options.exposedMethodNames  : The list of method names of the root object, which will be exposed via the post-me interface to the content script
   * @param  {Array.<string>} options.listenedEventsNames : The list of method names of the root object, which will be call on given event name via the post-me interface to the content script
   * @param  {object} options.webViewRef                  : Reference to the webview obect containing the content script
   * @returns {PostMeConnection} : the resulting post-me connection
   */
  async init(options) {}

  /**
   * Shortcut to remoteHandle.call method
   *
   * @param  {string} method : The remote method name
   * @param  {Array} args    : Any number of parameters which will be given to the remote method.
   * It is also possible to pass callback functions (which must support serialization). post-me
   * will wait the the remote method end before resolving the promise
   * @returns {any} remote method return value
   */
  async call(method, ...args) {
    return this.remoteHandle.call(method, ...args)
  }

  /**
   * Shortcut to localHandle.emit method. Will emit an event which could be listened by the remote
   * object
   *
   * @param  {string} eventName : Name of the event
   * @param  {Array} args       : Any number of parameters.
   */
  emit(eventName, ...args) {
    this.localHandle.emit(eventName, ...args)
  }

  /**
   * Shortcut to remoteHandle.addEventListener method. Will listen to the given event on the remote
   * object and call the listener function
   *
   * @param  {string} remoteEventName : Name of the remove event
   * @param  {Function} listener      : Listener function
   */
  addEventListener(remoteEventName, listener) {
    this.remoteHandle.addEventListener(remoteEventName, listener)
  }

  /**
   * Shortcut to remoteHandle.removeEventListener method. Will stop listening to the given event
   * on the remote object.
   *
   * @param  {string} remoteEventName : Name of the remote event
   * @param  {Function} listener      : Previously defined listener function
   */
  removeEventListener(remoteEventName, listener) {
    this.remoteHandle.removeEventListener(remoteEventName, listener)
  }
}

/**
 * All messengers are supposed to implement this interface
 *
 * @interface
 */
export class MessengerInterface {
  /**
   * Send a message to the other context
   *
   * @param {string} message : The payload of the message
   */
  postMessage(message) {}

  /**
   * Add a listener to messages received by the other context
   *
   * @param {Function} listener : A listener that will receive the MessageEvent
   * @returns {Function} A function that can be invoked to remove the listener
   */
  addMessageListener(listener) {}
}
