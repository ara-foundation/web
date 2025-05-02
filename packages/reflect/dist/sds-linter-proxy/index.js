import { ModuleLink } from "@ara-web/ts-enhancement";
import { ReflectProxy } from "../ReflectProxy.js";
export class SDSLinterProxy extends ReflectProxy {
    constructor() {
        super("SDS Linter proxy", ModuleLink.newPackageURL("@ara-web", "reflect-sds-linter-proxy"));
    }
    getFileRoot() {
    }
}
