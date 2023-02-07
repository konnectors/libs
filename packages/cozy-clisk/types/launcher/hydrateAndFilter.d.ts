declare function _default(documents: any[], doctype: string, options: {
    client: CozyClient;
    keys?: any[];
    selector?: object;
    shouldUpdate?: Function;
    shouldSave?: Function;
}): Promise<any>;
export default _default;
import CozyClient from "cozy-client/types/CozyClient";
