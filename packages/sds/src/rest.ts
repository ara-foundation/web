import { selectOne, selectAll } from "css-select";
import { OkResult, Result } from "@ara-web/p-hintjens";
import { 
    ExtensionOperator,
    Service, 
    type Extendable, 
    type Setup
} from "./sds.js";
import { 
    ObjectNodeAdapter, 
    ObjectNode, 
    type CustomSelectorNode, 
    type DataToObjectNode 
} from "./tree.js";
import { LinkTraits } from "./link-traits.js";
import { ModuleLink } from "./links/index.js";

export type PostHandler = <DataType>(parentNode: ObjectNode<DataType>, childNode: ObjectNode<DataType>) => Promise<OkResult>;
export type PutHandler = <DataType>(selector: string, node: ObjectNode<DataType>, data: DataType) => Promise<OkResult>;
export type PatchHandler = <DataType, AttrType>(selector: string, node: ObjectNode<DataType>, attrValue: AttrType) => Promise<OkResult>;
export type DeleteHandler = <DataType>(selector: string, nodes: ObjectNode<DataType>[]) => Promise<OkResult>;

/**
 * A Rest Extension that forwards rest to the side.
 * For example, to save the data in the file system or in the database.
 */
export class RestHandler implements Extendable {
    private _operatorLink: ModuleLink;
    private _tag: string;

    constructor(operatorLink: ModuleLink, tag: string) {
        this._operatorLink = operatorLink;
        this._tag = tag;
    }

    public get packageLink(): ModuleLink {
        return this._operatorLink;
    }

    public get tag(): string {
        return this._tag;
    }

    public isMatchingTag(selector: string): boolean {
        return LinkTraits.getTagName(selector)?.toLowerCase() === this._tag.toLowerCase();
    }

    public handlePost?: PostHandler;
    public handlePut?: PutHandler; 
    public handlePatch?: PatchHandler;
    public handleDelete?: DeleteHandler;
}

/**
 * RestDispatcher is the extension operator of the SDS service called Rest.
 */
export class RestDispatcher<ObjectDataType> extends ExtensionOperator {
    private get handlers(): RestHandler[] {
        return this.exts.filter(ext => ext instanceof RestHandler) as RestHandler[];
    }

    async post(parentNode: ObjectNode<ObjectDataType>, newBornChild: ObjectNode<ObjectDataType>): Promise<OkResult> {
        for (const handler of this.handlers) {
            if (handler.handlePost === undefined) {
                continue;
            }
            const handled = await handler.handlePost!(parentNode, newBornChild);
            if (handled.isFailure) {
                return OkResult.fail(`restHandler('${handler.packageLink}').posting(): ${handled.errorTitle}`, handled.errorDescription!);
            }
        }

        return OkResult.ok();
    }

    async put(selector: string, node: ObjectNode<ObjectDataType>, data: ObjectDataType): Promise<OkResult> {
        for (const handler of this.handlers) {
            if (handler.handlePut === undefined) {
                continue;
            }
            const handled = await handler.handlePut!(selector, node, data);
            if (handled.isFailure) {
                return OkResult.fail(`restHandler('${handler.packageLink}').handlePut(): ${handled.errorTitle}`, handled.errorDescription!);
            }
        }

        return OkResult.ok();
    }

    async patch<AttrType>(selector: string, node: ObjectNode<ObjectDataType>, data: AttrType): Promise<OkResult> {
        for (const handler of this.handlers) {
            if (handler.handlePatch === undefined) {
                continue;
            }
            const handled = await handler.handlePatch!(selector, node, data);
            if (handled.isFailure) {
                return OkResult.fail(`restHandler('${handler.packageLink}').handlePatch(): ${handled.errorTitle}`, handled.errorDescription!);
            }
        }

        return OkResult.ok();
    }

    async delete(selector: string, nodes: ObjectNode<ObjectDataType>[]): Promise<OkResult> {
        if (nodes.length === 0) {
            return OkResult.ok();
        }
        for (const handler of this.handlers) {
            if (handler.handleDelete === undefined) {
                continue;
            }
            const handled = await handler.handleDelete!(selector, nodes);
            if (handled.isFailure) {
                return OkResult.fail(`restHandler('${handler.packageLink}').handleDelete(selector: '${selector}'): ${handled.errorTitle}`, handled.errorDescription!);
            }
        }

        return OkResult.ok();
    }
}

/**
 * Rest methods. This interface is used to pass the rest object between modules.
 * If you want to implement your custom rest, then better {@link Rest}
 */
export interface Restful<ObjectDataType> {
    /**
     * A readonly methods of the Rest.
     */
    rootNode: ObjectNode<ObjectDataType>|undefined;
    setRootNode(obj: ObjectNode<ObjectDataType>): void;

    dataToObjectNode: DataToObjectNode<ObjectDataType>;
    clone?(attrSelector: string): Rest<ObjectDataType>;

    // Hooks
    get?(selector: string): Promise<ObjectNode<ObjectDataType>|null>;
    getAll?(selector: string): Promise<ObjectNode<ObjectDataType>[]>;
    post?(selector: string, data: ObjectDataType): Promise<OkResult>;
    put?(selector: string, data: ObjectDataType): Promise<OkResult>;
    patch?<AttrType>(attrSelector: string, data: AttrType): Promise<OkResult>;
    delete?(selector: string): Promise<OkResult>;

    // Dispatcher related
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
export class Rest<ObjectDataType> extends Service implements Restful<ObjectDataType> {
    private _options: {adapter: ObjectNodeAdapter<ObjectDataType>};
    private _root: ObjectNode<ObjectDataType>;
    readonly dataToObjectNode: DataToObjectNode<ObjectDataType>;

    constructor(
        object: ObjectDataType,
        dataToObjectNode: DataToObjectNode<ObjectDataType>,
        setup: Setup = {packageLink: ModuleLink.newPackageLink("@ara-web", "rest")}
    ) {
        super(setup, ["get", "getAll", "post", "put", "patch", "delete", "clone"]);
        this._options = {adapter: new ObjectNodeAdapter()};
        this._root = dataToObjectNode(object);
        this.dataToObjectNode = dataToObjectNode;
        this.operator = new RestDispatcher(setup.extensions || []);
    }

    public get rootNode(): ObjectNode<ObjectDataType> {
        return this._root;
    }

    public setRootNode(obj: ObjectNode<ObjectDataType>): void {
        this._root.children.forEach(child => child.setParent(obj));
        this._root = obj;
    }

    /**
     * Returns the extension operator as the rest dispatcher, since all rest handlers are returned as extensions.
     */
    public get dispatcher(): RestDispatcher<ObjectDataType> {
        return this.operator as RestDispatcher<ObjectDataType>;
    }

    /******************************************************************
     * 
     * RESTFule methods
     * 
     *******************************************************************/

    public async get?(selector: string): Promise<ObjectNode<ObjectDataType>|null> {
        return selectOne(selector, [this._root], this._options);
    }

    public async getAll?(selector: string): Promise<ObjectNode<ObjectDataType>[]> {
        return selectAll(selector, [this._root], this._options);
    }

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
    public async post?(parentSelector: string, childData: ObjectDataType): Promise<OkResult> {
        const parent = await this.get!(parentSelector);
        if (parent === null) {
            return Result.fail(`Rest.get('${parentSelector}'): parent not found`, `Please pass the correct selector`);
        }

        let newBornChild = this.dataToObjectNode!(childData, parent);

        const handled = await this.dispatcher.post(parent, newBornChild);
        if (handled.isFailure) {
            return OkResult.fail(`dispatcher.post(selector: '${parentSelector}'): ${handled.errorTitle}`, handled.errorDescription!);
        }
        newBornChild.parent!.appendChild(newBornChild);
        return OkResult.ok();
    }

    /**
     * Update a resource. The selector can not be #document. Which means it must have a parent.
     * @param selector 
     * @param data 
     */
    public async put?(selector: string, data: ObjectDataType): Promise<OkResult> {
        if (LinkTraits.isAttributeSelector(selector)) {
            return OkResult.fail(`LinkTraits.isAttributeSelector('${selector}'): can not put attribute, call patch`, `The selector has the attribute`)
        }
        let node = await this.get!(selector);
        if (node === null) {
            return OkResult.fail(`Rest.get('${selector}'): not found`, `Please pass the correct object selector`);
        } 
        if (node.parent === null) {
            return OkResult.fail(`Rest.get('${selector}'): parent not found`, `Please pass the correct object selector`);
        }
        const element = node.data;
        if (element !== null && typeof element !== typeof data) {
            return OkResult.fail(`Element type mismatch`)
        }

        const handled = await this.dispatcher.put(selector, node!, data);
        if (handled.isFailure) {
            return OkResult.fail(`dispatcher.put(selector: '${selector}'): ${handled.errorTitle}`, handled.errorDescription!);
        }

        node.data = data;
        return OkResult.ok();
    }

    /**
     * Make a partial update of a resource.
     * Requires the selector to be with attribute.
     * @param selector 
     * @param data 
     */
    public async patch?<AttrType>(attrSelector: string, data: AttrType): Promise<OkResult> {
        if (!LinkTraits.isAttributeSelector(attrSelector)) {
            return OkResult.fail(`LinkTraits.isAttributeSelector('${attrSelector}'): not an attribute`, `pass attribute selector`);
        }
        const attrName = LinkTraits.getAttributeName(attrSelector);
        const selector = LinkTraits.trimAttribute(attrSelector);
        const node = await this.get!(selector);
        if (node === null) {
            return OkResult.fail(`Rest.get('${selector}'): not found`, `There is no element with the selector`);
        }

        const handled = await this.dispatcher.patch(selector, node!, data);
        if (handled.isFailure) {
            return OkResult.fail(`dispatcher.patch(selector: '${selector}'): ${handled.errorTitle}`, handled.errorDescription!);
        }

        const attrSetted = node.setAttribute<AttrType>(attrName!, data);
        if (attrSetted.isFailure) {
            return OkResult.fail(`Rest.get('${selector}').setAttribute('${attrName}'): ${attrSetted.errorTitle}`, attrSetted.errorDescription!);
        }
        return OkResult.ok();
    }

    /**
     * Delete a resource. If resource not match, then return as it's ok
     * @param selector 
     */
    public async delete?(selector: string): Promise<OkResult> {
        const nodes = await this.getAll!(selector);
        const handled = await this.dispatcher.delete(selector, nodes);
        if (handled.isFailure) {
            return OkResult.fail(`dispatcher.delete(selector: '${selector}'): ${handled.errorTitle}`, handled.errorDescription!);
        }
        
        if (nodes.length === 0) {
            return OkResult.ok();
        }
        
        for (let node of nodes) {
            if (node.parent === null || node.parent === undefined) {
                continue;
            }
            // If the element has multiple duplicates, we remove only the first element.
            let filtered = false;
            const remainingChildren = node.parent.children.filter((child) => {
                if (filtered) {
                    return true;
                }
                if (child.isEqualTo(node)) {
                    filtered = true;
                    return false;
                }
                return true;
            })
            if (remainingChildren.length !== node.parent.children.length - 1) {
                return OkResult.fail(`Invalid cleared parent`, `Parent must have a one less element`);
            }
            node.parent.setChildren(remainingChildren);
        }

        return OkResult.ok();
    }

    public clone?(attrSelector: string): Rest<ObjectDataType> {
        const clone = new Rest<ObjectDataType>(this._root.data!, this.dataToObjectNode);
        clone._root = this._root;
        clone.delete!(attrSelector);
        return clone;
    }
}