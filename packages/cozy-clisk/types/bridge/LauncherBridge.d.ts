import { Connection } from 'post-me';
import { Bridge, InitObject } from './bridgeInterfaces';
/**
 * Bridge to the Launcher object via post-me
 */
export default class LauncherBridge implements Bridge {
    localWindow: any;
    connection: Connection;
    localHandle: any;
    remoteHandle: any;
    /**
     * Init the window which will be used to communicate with the launcher
     *
     * @param {object} options             : option object
     * @param {object} options.localWindow : The window used to communicate with the launcher
     */
    constructor({ localWindow }: {
        localWindow: any;
    });
    init({ exposedMethods }: InitObject): Promise<void>;
    call(method: any, ...args: any[]): Promise<any>;
    emit(eventName: any, ...args: any[]): void;
    addEventListener(remoteEventName: any, listener: any): void;
    removeEventListener(remoteEventName: any, listener: any): void;
}
