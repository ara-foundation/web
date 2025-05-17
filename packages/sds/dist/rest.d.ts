import { type SDSExtensionInterface, SDSService, type SDSSetup } from "./sds.js";
import { OkResult } from "@ara-web/p-hintjens";
import { ObjectNode, type ObjectToNodeTree } from "./link-traits.js";
export interface RestExtensionInterface extends SDSExtensionInterface {
}
/**
 * new Rest(setup, {slots: page.slots}, pageToTreeNode).get("Layout > Welcome")
 */
export declare class Rest<ElementType> extends SDSService<Rest<ElementType>, RestExtensionInterface> {
    private _options;
    private _nodes;
    private _objectToNodeTree;
    constructor(object: ElementType, objectToTreeNode: ObjectToNodeTree<ElementType>, setup?: SDSSetup<RestExtensionInterface>);
    /**
     * Retreive a resource node.
     * @param selector
     */
    get?(selector: string): ObjectNode<ElementType> | null;
    getAll?(selector: string): ObjectNode<ElementType>[];
    /**
     * Create a new resource. By default the
     * resource is created at the selector.
     *
     * If `options.lilBro` option put as `True` then
     * it will post the resource next after the `selector`.
     * @param selector
     * @param data
     */
    post?(selector: string, data: ObjectNode<ElementType>, options?: {
        lilBro: boolean;
    }): OkResult;
    /**
     * Update a resource. The selector can not be #document. Which means it must have a parent.
     * @param selector
     * @param data
     */
    put?(selector: string, data: ObjectNode<ElementType>): OkResult;
    /**
     * Make a partial update of a resource.
     * Requires the selector to be with attribute.
     * @param selector
     * @param data
     */
    patch?<AttrType>(attrSelector: string, data: AttrType): OkResult;
    /**
     * Delete a resource. If resource not match, then return as it's ok
     * @param selector
     */
    delete?(selector: string): OkResult;
    clone?(attrSelector: string): Rest<ElementType>;
}
