import { ModuleLink } from "@ara-web/sds";
// RestType is CodePiece
export class Module {
    link;
    /**
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import#module_namespace_object
     *
     * Returns all exported methods as the sealed object:
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/seal
     *
     * Sealing an object prevents extensions and makes existing properties non-configurable.
     */
    namespaceObject;
    category; // to filter out
    constructor(category, url, namespaceObject) {
        this.link = url;
        this.category = category;
        this.namespaceObject = namespaceObject;
    }
    /**
     * Returns the content (imported by glob)
     * @returns
     */
    as() {
        return this.namespaceObject;
    }
}
