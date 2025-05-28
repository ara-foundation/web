import { ModuleLink } from "@ara-web/sds";
export declare class Module {
    readonly link: ModuleLink;
    /**
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import#module_namespace_object
     *
     * Returns all exported methods as the sealed object:
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/seal
     *
     * Sealing an object prevents extensions and makes existing properties non-configurable.
     */
    readonly namespaceObject: unknown;
    readonly category: string;
    constructor(category: string, url: ModuleLink, namespaceObject: unknown);
    /**
     * Returns the content (imported by glob)
     * @returns
     */
    as<T>(): T;
}
