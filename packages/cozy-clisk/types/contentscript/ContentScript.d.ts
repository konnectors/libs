export const PILOT_TYPE: "pilot";
export const WORKER_TYPE: "worker";
export default class ContentScript {
    /**
     * Init the bridge communication with the launcher.
     * It also exposes the methods which will be callable by the launcher
     *
     * @param {object} options : options object
     * @param {Array<string>} [options.additionalExposedMethodsNames] : list of additional method of the
     * content script to expose expose. To make it callable via the worker
     */
    init(options?: {
        additionalExposedMethodsNames?: Array<string>;
    }): Promise<void>;
    bridge: LauncherBridge;
    store: {};
    /**
     * Set the ContentScript type. This is usefull to know which webview is the pilot or the worker
     *
     * @param {string} contentScriptType - ("pilot" | "worker")
     */
    setContentScriptType(contentScriptType: string): Promise<void>;
    contentScriptType: string;
    /**
     * Check if the user is authenticated or not. This method is made to be overloaded by the child class
     *
     * @returns {Promise.<boolean>} : true if authenticated or false in other case
     */
    checkAuthenticated(): Promise<boolean>;
    /**
     * This method is made to run in the worker and will resolve as true when
     * the user is authenticated
     *
     * @returns {Promise.<true>} : if authenticated
     * @throws {Error}: TimeoutError from p-wait-for package if timeout expired
     */
    waitForAuthenticated(): Promise<true>;
    /**
     * Run a specified method in the worker webview
     *
     * @param {string} method : name of the method to run
     */
    runInWorker(method: string, ...args: any[]): Promise<any>;
    /**
     * Wait for a method to resolve as true on worker
     *
     * @param {object} options        - options object
     * @param {string} options.method - name of the method to run
     * @param {number} [options.timeout] - number of miliseconds before the function sends a timeout error. Default Infinity
     * @param {Array} options.args - array of args to pass to the method
     * @returns {Promise<boolean>} - true
     * @throws {Error} - if timeout expired
     */
    runInWorkerUntilTrue({ method, timeout, args }: {
        method: string;
        timeout?: number;
        args: any[];
    }): Promise<boolean>;
    /**
     * Wait for a dom element to be present on the page, even if there are page redirects or page
     * reloads
     *
     * @param {string} selector - css selector we are waiting for
     */
    waitForElementInWorker(selector: string): Promise<void>;
    /**
     * Wait for a dom element to be present on the page. This won't resolve if the page reloads
     *
     * @param {string} selector - css selector we are waiting for
     * @returns {Promise.<true>} - Returns true when ready
     */
    waitForElementNoReload(selector: string): Promise<true>;
    click(selector: any): Promise<void>;
    clickAndWait(elementToClick: any, elementToWait: any): Promise<void>;
    fillText(selector: any, text: any): Promise<void>;
    /**
     * Bridge to the saveFiles method from the launcher.
     * - it prefilters files according to the context comming from the launcher
     * - download files when not filtered out
     * - converts blob files to base64 uri to be serializable
     *
     * @param {Array} entries : list of file entries to save
     * @param {object} options : saveFiles options
     */
    saveFiles(entries: any[], options: object): Promise<any>;
    /**
     * Bridge to the saveBills method from the launcher.
     * - it first saves the files
     * - then saves bills linked to corresponding files
     *
     * @param {Array} entries : list of file entries to save
     * @param {object} options : saveFiles options
     */
    saveBills(entries: any[], options: object): Promise<any>;
    /**
     * Bridge to the getCredentials method from the launcher.
     */
    getCredentials(): Promise<any>;
    /**
     * Bridge to the saveCredentials method from the launcher.
     *
     * @param {object} credentials : object with credentials specific to the current connector
     */
    saveCredentials(credentials: object): Promise<any>;
    /**
     * Bridge to the saveIdentity method from the launcher.
     *
     * @param {object} identity : io.cozy.contacts object
     */
    saveIdentity(identity: object): Promise<any>;
    /**
     * Bridge to the getCookiesByDomain method from the RNlauncher.
     *
     * @param {string} domain : domain name
     */
    getCookiesByDomain(domain: string): Promise<any>;
    /**
     * Bridge to the getCookieFromKeychainByName method from the RNlauncher.
     *
     * @param {string} cookieName : cookie name
     */
    getCookieFromKeychainByName(cookieName: string): Promise<any>;
    /**
     * Bridge to the saveCookieToKeychain method from the RNlauncher.
     *
     * @param {string} cookieValue : cookie value
     */
    saveCookieToKeychain(cookieValue: string): Promise<any>;
    getCookieByDomainAndName(cookieDomain: any, cookieName: any): Promise<any>;
    /**
     * Do not download files which already exist
     *
     * @param {Array} files : array of file objects
     * @param {object} options : options object
     * @param {Array.<string>} options.fileIdAttributes : list of attributes defining the unicity of the file
     * @param {object} options.context : current launcher context
     * @returns {Array} : filtered array of file objects
     */
    filterOutExistingFiles(files: any[], options: {
        fileIdAttributes: Array<string>;
        context: object;
    }): any[];
    /**
     * Creates an index of files, indexed by uniq id defined by fileIdAttributes
     *
     * @param {object} context : current context object
     * @param {Array.<string>} fileIdAttributes : list of attributes defining the unicity of a file
     * @returns {object} : context file index
     */
    createContextFilesIndex(context: object, fileIdAttributes: Array<string>): object;
    /**
     * Calculates the key defining the uniqueness of a given file
     *
     * @param {object} file : file object
     * @param {Array.<string>} fileIdAttributes : list of attributes defining the unicity of a file
     * @returns {string} : file key
     */
    calculateFileKey(file: object, fileIdAttributes: Array<string>): string;
    /**
     * Send log message to the launcher
     *
     * @param {"debug"|"info"|"warn"|"error"} level the log level
     * @param {string} message the log message
     */
    log(level: "debug" | "info" | "warn" | "error", message: string): void;
    /**
     * @typedef SetWorkerStateOptions
     * @property {string} [url]      : url displayed by the worker webview for the login
     * @property {boolean} [visible] : will the worker be visible or not
     */
    /**
     * This is a proxy to the "setWorkerState" command in the launcher
     *
     * @param {SetWorkerStateOptions} options : worker state options
     */
    setWorkerState(options?: {
        /**
         * : url displayed by the worker webview for the login
         */
        url?: string;
        /**
         * : will the worker be visible or not
         */
        visible?: boolean;
    }): Promise<void>;
    /**
     * Set the current url of the worker
     *
     * @param {string} url : the url
     */
    goto(url: string): Promise<void>;
    /**
     * Make sur that the connector is authenticated to the website.
     * If not, show the login webview to the user to let her/him authenticated.
     * Resolve the promise when authenticated
     *
     * @throws LOGIN_FAILED
     * @returns {Promise.<boolean>} : true if the user is authenticated
     */
    ensureAuthenticated(): Promise<boolean>;
    /**
     * Returns whatever unique information on the authenticated user which will be usefull
     * to identify fetched data : destination folder name, fetched data metadata
     *
     * @returns {Promise.<object>}  : user data object
     */
    getUserDataFromWebsite(): Promise<object>;
    /**
     * In worker context, send the given data to the pilot to be stored in its own store
     *
     * @param {object} obj : any object with data to store
     */
    sendToPilot(obj: object): Promise<any>;
    /**
     * Store data sent from worker with sendToPilot method
     *
     * @param {object} obj : any object with data to store
     */
    storeFromWorker(obj: object): Promise<void>;
    onlyIn(csType: any, method: any): void;
    /**
     * Main function, fetches all connector data and save it to the cozy
     *
     * @param {object} options : options object
     * @param {object} options.context : all the data already fetched by the connector in a previous execution. Will be usefull to optimize
     * connector execution by not fetching data we already have.
     * @returns {Promise.<object>} : Connector execution result. TBD
     */
    fetch(options: {
        context: object;
    }): Promise<object>;
}
import LauncherBridge from "../bridge/LauncherBridge";
