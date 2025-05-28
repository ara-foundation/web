import { OkResult } from "@ara-web/p-hintjens";
import { ExtensionOperator, Service, type Extendable, type Setup } from "./sds.js";
import { ObjectNode, type DataToObjectNode } from "./tree.js";
import { ModuleLink } from "./links/index.js";
export type PostHandler = <DataType>(parentOrBigBro: ObjectNode<DataType>, node: ObjectNode<DataType>, options?: {
    lilBro?: boolean;
}) => Promise<OkResult>;
export type PutHandler = <DataType>(selector: string, node: ObjectNode<DataType>, data: DataType) => Promise<OkResult>;
export type PatchHandler = <DataType, AttrType>(selector: string, node: ObjectNode<DataType>, attrValue: AttrType) => Promise<OkResult>;
export type DeleteHandler = <DataType>(selector: string, nodes: ObjectNode<DataType>[]) => Promise<OkResult>;
/**
 * RestSynchronizer is used to keep track of the object nodes
 * that are pending to be synchronized by the rest.
 */
export declare class RestSynchronizer {
    readonly pendingKeys: Set<string>;
    readonly rootNode: ObjectNode<any>;
    readonly objectToNodeTree: DataToObjectNode<any>;
    constructor(node: ObjectNode<any>, objectToNodeTree: DataToObjectNode<any>);
}
/**
 * A Rest Extension that forwards rest to the side.
 * For example, to save the data in the file system or in the database.
 */
export declare class RestHandler implements Extendable {
    private _operatorLink;
    private _tag;
    constructor(operatorLink: ModuleLink, tag: string);
    get packageLink(): ModuleLink;
    get tag(): string;
    isMatchingTag(selector: string): boolean;
    handlePost?: PostHandler;
    handlePut?: PutHandler;
    handlePatch?: PatchHandler;
    handleDelete?: DeleteHandler;
}
export declare class RestDispatcher<ObjectDataType> extends ExtensionOperator {
    private get handlers();
    post(parentOrBigBro: ObjectNode<ObjectDataType>, newBornChild: ObjectNode<ObjectDataType>, options?: {
        lilBro?: boolean;
    }): Promise<OkResult>;
    put(selector: string, node: ObjectNode<ObjectDataType>, data: ObjectDataType): Promise<OkResult>;
    patch<AttrType>(selector: string, node: ObjectNode<ObjectDataType>, data: AttrType): Promise<OkResult>;
    delete(selector: string, nodes: ObjectNode<ObjectDataType>[]): Promise<OkResult>;
}
/**
 * Rest methods. This interface is used to pass the rest object between modules.
 * If you want to implement your custom rest, then better {@link Rest}
 */
export interface Restful<ObjectDataType> {
    /**
     * A readonly methods of the Rest.
     */
    rootNode: ObjectNode<ObjectDataType> | undefined;
    setRootNode(obj: ObjectNode<ObjectDataType>): void;
    dataToObjectNode: DataToObjectNode<ObjectDataType>;
    clone?(attrSelector: string): Rest<ObjectDataType>;
    get?(selector: string): Promise<ObjectNode<ObjectDataType> | null>;
    getAll?(selector: string): Promise<ObjectNode<ObjectDataType>[]>;
    post?(selector: string, data: ObjectDataType, options?: {
        lilBro?: boolean;
    }): Promise<OkResult>;
    put?(selector: string, data: ObjectDataType): Promise<OkResult>;
    patch?<AttrType>(attrSelector: string, data: AttrType): Promise<OkResult>;
    delete?(selector: string): Promise<OkResult>;
    dispatcher: RestDispatcher<ObjectDataType>;
}
export interface RestOptions<ObjectDataType> {
    lilBro?: boolean;
    parent?: ObjectNode<ObjectDataType>;
    root?: boolean;
}
/**
 * Rest is the Service that creates a CSS Selector traversing for the objects.
 *
 * It starts by accepting the JSON object that could be the root node.
 *
 * The rest extensions are called forwarders and if given, they will forward the written data to the extension.
 *
 * Example to use:
 *
 * ```
 * const rest = new Rest(setup, {slots: page.slots}, pageToTreeNode);
 * const welcomeComponent = await rest.get!("Layout > Welcome")
 * ```
 */
export declare class Rest<ObjectDataType> extends Service implements Restful<ObjectDataType> {
    private _options;
    private _root;
    readonly dataToObjectNode: DataToObjectNode<ObjectDataType>;
    constructor(object: ObjectDataType, dataToObjectNode: DataToObjectNode<ObjectDataType>, setup?: Setup);
    get rootNode(): ObjectNode<ObjectDataType>;
    setRootNode(obj: ObjectNode<ObjectDataType>): void;
    /**
     * Returns the extension operator as the rest dispatcher, since all rest handlers are returned as extensions.
     */
    get dispatcher(): RestDispatcher<ObjectDataType>;
    /******************************************************************
     *
     * RESTFule methods
     *
     *******************************************************************/
    get?(selector: string): Promise<ObjectNode<ObjectDataType> | null>;
    getAll?(selector: string): Promise<ObjectNode<ObjectDataType>[]>;
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
    post?(selector: string, data: ObjectDataType, options?: {
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
    put?(selector: string, data: ObjectDataType): Promise<OkResult>;
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
    clone?(attrSelector: string): Rest<ObjectDataType>;
}
