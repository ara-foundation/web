import { selectOne as cssSelectOne } from "css-select";
import { SDSService } from "#sds";
import { OkResult } from "./result.js";
export class Rest extends SDSService {
    _options;
    _nodes = [];
    constructor(setup, adapter, treeNodes) {
        super(setup, []);
        this._options = { adapter };
        this._nodes = treeNodes;
    }
    /**
     * Retreive a resource node.
     * @param selector
     */
    get(selector) {
        return cssSelectOne(selector, this._nodes, this._options);
    }
    /**
     * Create a new resource.
     *
     * If provided a selector, then it will be assigning the
     * data into the attribute value.
     * @param selector
     * @param data
     */
    post(selector, data) {
        return OkResult.fail(`Not implemented`, `Come back later`);
    }
    /**
     * Update a resource, requires the selector to be
     * without any attributes.
     * @param selector
     * @param data
     */
    put(selector, data) {
        return OkResult.fail(`Not implemented`, `Come back later`);
    }
    /**
     * Make a partial update of a resource.
     * Requires the selector to be with attribute.
     * @param selector
     * @param data
     */
    patch(selector, data) {
        return OkResult.fail(`Not implemented`, `Come back later`);
    }
    /**
     * Delete a resource
     * @param selector
     */
    delete(selector) {
        return OkResult.fail(`Not implemented`, `Come back later`);
    }
}
