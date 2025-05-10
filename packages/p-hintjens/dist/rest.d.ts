import { type SDSExtensionInterface, SDSService, type SDSSetup } from "#sds";
import { OkResult } from "./result.js";
import type { Adapter } from "./traits/index.js";
export interface RestExtensionInterface extends SDSExtensionInterface {
}
export declare class Rest<CSSNode, TreeNode extends CSSNode, CSSAdapter extends Adapter<CSSNode, TreeNode>> extends SDSService<Rest<CSSNode, TreeNode, CSSAdapter>, RestExtensionInterface> {
    private _options;
    private _nodes;
    constructor(setup: SDSSetup<RestExtensionInterface>, adapter: CSSAdapter, treeNodes: TreeNode[]);
    /**
     * Retreive a resource node.
     * @param selector
     */
    get(selector: string): TreeNode | null;
    /**
     * Create a new resource.
     *
     * If provided a selector, then it will be assigning the
     * data into the attribute value.
     * @param selector
     * @param data
     */
    post<AttrType>(selector: string, data: TreeNode | AttrType): OkResult;
    /**
     * Update a resource, requires the selector to be
     * without any attributes.
     * @param selector
     * @param data
     */
    put(selector: string, data: TreeNode): OkResult;
    /**
     * Make a partial update of a resource.
     * Requires the selector to be with attribute.
     * @param selector
     * @param data
     */
    patch<DataType, AttrType>(selector: string, data: DataType): OkResult;
    /**
     * Delete a resource
     * @param selector
     */
    delete<DataType>(selector: string): OkResult;
}
