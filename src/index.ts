export * from './evarlik-rest'

import {EvarlikRest} from "./evarlik-rest";
import {isNullOrUndefined} from "util";

let api;

export function evarlikWebApi(options: {
    token?: string, test: boolean, timeout: number, tokenOptions?: {
        useAsyncStorage: boolean,
        tokenKey: string,
        asyncStorage: any
    }
}): EvarlikRest {
    if (isNullOrUndefined(api)) {
        api = new EvarlikRest(options);
    }
    return api;

}
