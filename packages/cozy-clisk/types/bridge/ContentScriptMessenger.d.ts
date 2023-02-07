import { MessengerInterface } from './bridgeInterfaces';
/**
 * post-me messenger implementation for a content script implanted in a react native webview
 */
export default class ReactNativeWebviewMessenger implements MessengerInterface {
    localWindow: any;
    /**
     * Init the window which will be used to post messages and listen to messages
     *
     * @param  {object} options             : options object
     * @param  {object} options.localWindow : The window object
     */
    constructor({ localWindow }: {
        localWindow: any;
    });
    postMessage(message: any): void;
    addMessageListener(listener: any): () => void;
}
