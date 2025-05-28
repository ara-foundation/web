import { ModuleLink } from "@ara-web/sds";

// RestType is CodePiece
export class Module {
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
    readonly category: string;    // to filter out

    constructor(category: string, url: ModuleLink, namespaceObject: unknown) {
        this.link = url;
        this.category = category;
        this.namespaceObject = namespaceObject;
    }

    /**
     * Returns the content (imported by glob)
     * @returns 
     */
    as<T>(): T {
        return this.namespaceObject as T;
    }
}