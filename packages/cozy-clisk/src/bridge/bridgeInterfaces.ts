import { MethodsType } from "post-me";

/**
 * All bridges are supposed to implement this interface
 */

export interface Bridge {
  remoteHandle: Function;
  localHandle: Function;
  init(initObject: InitObject ): Promise<void>;
  call(method: string, ...args: Array<any>): Promise<any>;
  emit(eventName: string, ...args: Array<any>);
  addEventListener(remoteEventName: string, listener: Function);
  removeEventListener(remoteEventName: string, listener: Function);

}

export interface InitObject { 
  //The object which will contain the exposed method names
  root?: Object
  // The list of method names of the root object, which will be exposed via the post-me interface to the content script
  exposedMethods?: MethodsType
  // The list of method names of the root object, which will be call on given event name via the post-me interface to the content script
  listenedEventsNames?: Array<string>
  // Reference to the webview obect containing the content script
  webViewRef?: Object 
}



/**
 * All messengers are supposed to implement this interface
 *
 * @interface
 */
export interface MessengerInterface {
  /**
   * Send a message to the other context
   *
   * @param {string} message : The payload of the message
   */
  postMessage(message: string): void;

  /**
   * Add a listener to messages received by the other context
   *
   * @param {Function} listener : A listener that will receive the MessageEvent
   * @returns {Function} A function that can be invoked to remove the listener
   */
  addMessageListener(listener: Function):Function
}
