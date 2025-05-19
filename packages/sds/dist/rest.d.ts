import { OkResult, Result } from "@ara-web/p-hintjens";
import { SDSProxy, SDSService, type SDSSetup } from "./sds.js";
import { type ObjectNode, type SDSExtensionInterface, ModuleLink } from "./index.js";
import { type ObjectToNodeTree } from "./link-traits.js";
export interface RestExtensionInterface extends SDSExtensionInterface {
}
export interface RestOptions<ElementType> {
    lilBro?: boolean;
    parent?: ObjectNode<ElementType>;
    root?: boolean;
}
export declare class RestBranchProxy<ElementType> extends SDSProxy {
    protected _behindData?: Rest<ElementType>;
    private _root;
    constructor(root: ObjectNode<ElementType>, moduleLink: ModuleLink, description?: string);
    set rootNode(obj: ObjectNode<ElementType>);
    get rootNode(): ObjectNode<ElementType> | undefined;
    putBehindData?(behindData: Rest<ElementType>): void;
    getAll?(selector: string): ObjectNode<ElementType>[];
    post?(selector: string, data: ElementType, options: Omit<RestOptions<ElementType>, "parent">): OkResult;
}
/**
 * new Rest(setup, {slots: page.slots}, pageToTreeNode).get("Layout > Welcome")
 */
export declare class Rest<ElementType> extends SDSService<Rest<ElementType>, RestExtensionInterface> {
    private _options;
    private _root;
    private _objectToNodeTree;
    constructor(object: ElementType, objectToTreeNode: ObjectToNodeTree<ElementType>, setup?: SDSSetup<RestExtensionInterface>);
    setRootNode(obj: ObjectNode<ElementType>): void;
    get rootNode(): ObjectNode<ElementType>;
    elementToObjectNode?(data: ElementType, options: RestOptions<ElementType>): Result<ObjectNode<ElementType>>;
    /**
     * Retreive a resource node.
     * @param selector
     */
    get?(selector: string): ObjectNode<ElementType> | null;
    getAll?(selector: string): ObjectNode<ElementType>[];
    post?(selector: string, data: ElementType, options: Omit<RestOptions<ElementType>, "parent">): OkResult;
    /**
     * Create a new resource. By default the
     * resource is created at the selector.
     *
     * If `options.lilBro` option put as `True` then
     * it will post the resource next after the `selector`.
     * @param selector
     * @param data
     */
    private _post;
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
