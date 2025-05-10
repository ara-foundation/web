import { Debug } from "../index.js";
import { selectAll as cssGetAll, selectOne as cssGet, is as isCssObjectMatchQuery, compile as cssCompile } from "css-select";
export class LinkTraits {
    // Queries elems, returns an array containing all matches.
    static getAll(query, objects, options) {
        return cssGetAll(query, objects, options);
    }
    static isObjectMatchQuery(node, query, options) {
        return isCssObjectMatchQuery(node, query, options);
    }
    static get(query, objects, options) {
        return cssGet(query, objects, options);
    }
    static compile(query, options) {
        const compiled = cssCompile(query, options);
        Debug.log(compiled);
    }
}
