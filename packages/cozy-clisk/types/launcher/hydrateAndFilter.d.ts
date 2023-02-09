declare function _default(documents: any[], doctype: string, options: {
    client: import('cozy-client/types/CozyClient').default;
    keys?: any[];
    selector?: object;
    shouldUpdate?: Function;
    shouldSave?: Function;
}): Promise<any>;
export default _default;
