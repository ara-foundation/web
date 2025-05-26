import { OkResult, Result } from "@ara-web/p-hintjens";
import { Service, type Extension, type Setup } from "./sds.js";
import { ObjectNode, type DataToObjectNode } from "./tree.js";
import { ModuleLink } from "./links/index.js";
export type Posting = <DataType>(parentOrBigBro: ObjectNode<DataType>, node: ObjectNode<DataType>, options?: {
    lilBro?: boolean;
}) => Promise<OkResult>;
export type Putting = <DataType>(selector: string, node: ObjectNode<DataType>, data: DataType) => Promise<OkResult>;
export type Patching = <DataType, AttrType>(selector: string, node: ObjectNode<DataType>, attrValue: AttrType) => Promise<OkResult>;
export type Deleting = <DataType>(selector: string, nodes: ObjectNode<DataType>[]) => Promise<OkResult>;
/**
 * Rest converts the json into a node tree.
 * But rest is planned to be used in all application.
 * So, it allows adding any data.
 *
 * Additionally, Rest also has the dispatcher.
 * If dispatcher is given, then rest will forward any operation to that dispatcher.
 *
 * Additionally, Rest also has the syncer.
 * If queue is given, then, rest before any request will ask queue,
 * does it have any data to execute. If so, it will execute them before any operation.
 *
 * Any module, that has to synchronize must have it's node inside. And if given data,
 * it must synchronize the rest with it.
 *
 * for example:
 * in reflect:
 * exts = new NodeJSextension().
 * exts[0].node = rest.get!('#${ext.packageLink.moduleURL}');
 * exts[0].putModules()
 *      node !== undefined, and if module !== this.synchronizer.isExist()?
 *          node.appendChild(nodeModules);
 *          node.set();
 *
 * Rest Queue:
 * Calls the rest queue.
 */
export declare class RestQueue {
    private _queue;
    private _parentNode?;
    private _objectToNodeTree?;
    constructor(parentNode?: ObjectNode<any>, objectToNodeTree?: DataToObjectNode<any>);
    get parentNode(): ObjectNode<any> | undefined;
    get objectToNodeTree(): DataToObjectNode<any> | undefined;
    setAll(node: ObjectNode<any>, objectToNodeTree: DataToObjectNode<any>): void;
    isExist(key: string): boolean;
    set(key: string): void;
    unset(key: string): void;
}
/**
 * A Rest Extension that forwards rest to the side.
 * For example, to save the data in the file system or in the database.
 */
export declare class RestDispatcher implements Extension {
    private _operatorLink;
    private _tag;
    constructor(operatorLink: ModuleLink, tag: string);
    get packageLink(): ModuleLink;
    get tag(): string;
    isMatchingTag(selector: string): boolean;
    posting?: Posting;
    putting?: Putting;
    patching?: Patching;
    deleting?: Deleting;
}
/**
 * Rest methods. This interface is used to pass the rest object between modules.
 * If you want to implement your custom rest, then better {@link Rest}
 */
export interface RestTraits<ElementType> {
    /**
     * A readonly methods of the Rest.
     */
    rootNode: ObjectNode<ElementType> | undefined;
    setRootNode(obj: ObjectNode<ElementType>): void;
    objectToNodeTree: DataToObjectNode<ElementType>;
    elementToObjectNode?(data: ElementType, options: RestOptions<ElementType>): Result<ObjectNode<ElementType>>;
    clone?(attrSelector: string): Rest<ElementType>;
    get?(selector: string): Promise<ObjectNode<ElementType> | null>;
    getAll?(selector: string): Promise<ObjectNode<ElementType>[]>;
    post?(selector: string, data: ElementType, options?: {
        lilBro?: boolean;
    }): Promise<OkResult>;
    put?(selector: string, data: ElementType): Promise<OkResult>;
    patch?<AttrType>(attrSelector: string, data: AttrType): Promise<OkResult>;
    delete?(selector: string): Promise<OkResult>;
    dispatchers: Readonly<RestDispatcher>[];
}
export interface RestOptions<ElementType> {
    lilBro?: boolean;
    parent?: ObjectNode<ElementType>;
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
export declare class Rest<ObjectDataType> extends Service implements RestTraits<ObjectDataType> {
    private _options;
    private _root;
    private _objectToNodeTree;
    constructor(object: ObjectDataType, objectToTreeNode: DataToObjectNode<ObjectDataType>, setup?: Setup);
    get rootNode(): ObjectNode<ObjectDataType>;
    setRootNode(obj: ObjectNode<ObjectDataType>): void;
    get objectToNodeTree(): DataToObjectNode<ObjectDataType>;
    get dispatchers(): Readonly<RestDispatcher>[];
    elementToObjectNode?(data: ObjectDataType, options: RestOptions<ObjectDataType>): Result<ObjectNode<ObjectDataType>>;
    /**
     * Retreive a resource node.
     * @param selector
     */
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
