import { OkResult, Result } from "@ara-web/p-hintjens";
import { SDSProxy, SDSService, type SDSExtensionInterface, type SDSSetup } from "./sds.js";
import { ObjectNode, type ObjectToNodeTree } from "./link-traits.js";
import { ModuleLink } from "./links/index.js";
export interface RestExtensionInterface extends SDSExtensionInterface {
}
export interface RestInterface<ElementType> {
    rootNode: ObjectNode<ElementType> | undefined;
    setRootNode(obj: ObjectNode<ElementType>): void;
    elementToObjectNode?(data: ElementType, options: RestOptions<ElementType>): Result<ObjectNode<ElementType>>;
    clone?(attrSelector: string): Rest<ElementType>;
    get?(selector: string): Promise<ObjectNode<ElementType> | null>;
    getAll?(selector: string): Promise<ObjectNode<ElementType>[]>;
    post?(selector: string, data: ElementType, options?: {
        lilBro?: boolean;
    }): Promise<OkResult>;
    put?(selector: string, data: ObjectNode<ElementType>): Promise<OkResult>;
    patch?<AttrType>(attrSelector: string, data: AttrType): Promise<OkResult>;
    delete?(selector: string): Promise<OkResult>;
}
export interface RestOptions<ElementType> {
    lilBro?: boolean;
    parent?: ObjectNode<ElementType>;
    root?: boolean;
}
export declare class RestBranchProxy<ElementType> extends SDSProxy implements RestInterface<ElementType> {
    protected _behindData?: Rest<ElementType>;
    private _root;
    constructor(root: ObjectNode<ElementType>, moduleLink: ModuleLink, description?: string);
    setRootNode(obj: ObjectNode<ElementType>): void;
    get rootNode(): ObjectNode<ElementType> | undefined;
    putBehindData?(behindData: Rest<ElementType>): void;
    getAll?(selector: string): Promise<ObjectNode<ElementType>[]>;
    post?(selector: string, data: ElementType, options: Omit<RestOptions<ElementType>, "parent">): Promise<OkResult>;
}
/**
 * new Rest(setup, {slots: page.slots}, pageToTreeNode).get("Layout > Welcome")
 */
export declare class Rest<ElementType> extends SDSService<Rest<ElementType>, RestExtensionInterface> implements RestInterface<ElementType> {
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
    get?(selector: string): Promise<ObjectNode<ElementType> | null>;
    getAll?(selector: string): Promise<ObjectNode<ElementType>[]>;
    /**
     * Post creates a new object node as `selector` child.
     * The object node's data is passed by `data` argument.
     *
     * If `options.lilBro` is set, then `data` is set after `selector` in the same parent.
     *
     * Firstly, the method converts the selector into a parent node.
     * Secondly, the method converts the data along with parent node into an object node.
     * Thirdly using {@link _appendChild} appends the object node into a parent.
     *
     * This method doesn't set the children relationship to the parent.
     * Letting know that selector is a parent occurs in the ObjectNode instantiation.
     * @requires Selector to exist, the object must have a parent.
     * @param selector Parent or a big brother's link if `options.lilBro` is set true.
     * @param data  Object node's data
     * @param options Set to little bro if you want to set object after the selector.
     * @returns
     */
    post?(selector: string, data: ElementType, options?: {
        lilBro?: boolean;
    }): Promise<OkResult>;
    private _getParentOrBigBro;
    /**
     * Append the data as the child of a parent by calling `data.parent.appendChild()`
     * or `data.parent.setChildren()`.
     * @param newBornChild
     * @param bigBro
     */
    private _appendChild;
    /**
     * Update a resource. The selector can not be #document. Which means it must have a parent.
     * @param selector
     * @param data
     */
    put?(selector: string, data: ObjectNode<ElementType>): Promise<OkResult>;
    /**
     * Make a partial update of a resource.
     * Requires the selector to be with attribute.
     * @param selector
     * @param data
     */
    patch?<AttrType>(attrSelector: string, data: AttrType): Promise<OkResult>;
    /**
     * Delete a resource. If resource not match, then return as it's ok
     * @param selector
     */
    delete?(selector: string): Promise<OkResult>;
    clone?(attrSelector: string): Rest<ElementType>;
}
