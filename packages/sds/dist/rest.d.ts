import { OkResult } from "@ara-web/p-hintjens";
import { ExtensionOperator, Service, type Extendable, type Setup } from "./sds.js";
import { ObjectNode, type DataToObjectNode } from "./tree.js";
import { ModuleLink } from "./links/index.js";
export type PostHandler = <DataType>(parentNode: ObjectNode<DataType>, childNode: ObjectNode<DataType>) => Promise<OkResult>;
export type PutHandler = <DataType>(selector: string, node: ObjectNode<DataType>, data: DataType) => Promise<OkResult>;
export type PatchHandler = <DataType, AttrType>(selector: string, node: ObjectNode<DataType>, attrValue: AttrType) => Promise<OkResult>;
export type DeleteHandler = <DataType>(selector: string, nodes: ObjectNode<DataType>[]) => Promise<OkResult>;
export declare function RestfulMethod(message?: string): (target: any, key: any, descriptor: TypedPropertyDescriptor<any>) => any;
/**
 * If the object that restful api posted
 * is having it's own restful handler for its sub objects,
 * then pass it.
 */
export interface SubRestfulHandler {
    restHandler?: RestfulHandler;
}
export interface RestfulHandler extends Extendable {
    /**
     * Tag that filters out the restful handler
     */
    tag: string;
    /**
     * Is the selector matches the tag that filters by this handler
     * @param selector
     */
    isMatchingTag(selector: string): boolean;
    handlePost?: PostHandler;
    handlePut?: PutHandler;
    handlePatch?: PatchHandler;
    handleDelete?: DeleteHandler;
}
/**
 * A Rest Extension that forwards rest to the side.
 * For example, to save the data in the file system or in the database.
 */
export declare class RestHandler implements RestfulHandler {
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
/**
 * RestDispatcher is the extension operator of the SDS service called Rest.
 */
export declare class RestDispatcher<ObjectDataType> extends ExtensionOperator {
    private get handlers();
    /**
     * Dispatch newly created data, for example to save in the database
     * @param parentNode
     * @param newBornChild
     * @returns
     */
    post(parentNode: ObjectNode<ObjectDataType>, newBornChild: ObjectNode<ObjectDataType>): Promise<OkResult>;
    /**
     * Dispatch the data update for example update the database row.
     * @param selector
     * @param node
     * @param data
     * @returns
     */
    put(selector: string, node: ObjectNode<ObjectDataType>, data: ObjectDataType): Promise<OkResult>;
    /**
     * Dispatch the update of the data's property, for example to update the database.
     * @param selector
     * @param node
     * @param data
     * @returns
     */
    patch<AttrType>(selector: string, node: ObjectNode<ObjectDataType>, data: AttrType): Promise<OkResult>;
    /**
     * Dispatch the deletion of the data, for example delete the row in the database too.
     * @param selector
     * @param nodes
     * @returns
     */
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
    get?(selector: string): Promise<ObjectNode<ObjectDataType> | null>;
    getAll?(selector: string): Promise<ObjectNode<ObjectDataType>[]>;
    post?(parentSelector: string, data: ObjectDataType): Promise<OkResult>;
    put?(selector: string, data: ObjectDataType): Promise<OkResult>;
    patch?<AttrType>(attrSelector: string, data: AttrType): Promise<OkResult>;
    delete?(selector: string): Promise<OkResult>;
    dispatcher: RestDispatcher<ObjectDataType>;
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
    constructor(dataToObjectNode: DataToObjectNode<ObjectDataType>, setup?: Setup);
    get rootNode(): ObjectNode<ObjectDataType>;
    setRootNode(obj: ObjectNode<ObjectDataType>): void;
    /**
     * Returns the extension operator as the rest dispatcher,
     * since all writing back in the code is done by the extensions.
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
     * @param parentSelector Parent or a big brother's link if `options.lilBro` is set true.
     * @param childData  Object node's data
     * @param options Set to little bro if you want to set object after the selector.
     * @returns
     */
    post?(parentSelector: string, childData: ObjectDataType): Promise<OkResult>;
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
}
