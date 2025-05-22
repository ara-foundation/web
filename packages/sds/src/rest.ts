import { OkResult, Result } from "@ara-web/p-hintjens";
import { 
    selectOne as cssSelectOne, 
    selectAll as cssSelectAll 
} from "css-select";
import { 
    SDSProxy,
    SDSService, 
    type SDSExtensionInterface, 
    type SDSSetup
} from "./sds.js";
import { 
    CSSObjectAdapter, 
    LinkTraits, 
    ObjectNode, 
    type ObjectNodeInterface, 
    type ObjectToNodeTree 
} from "./link-traits.js";
import { ModuleLink } from "./links/index.js";

// We call it setters.
export interface RestExtensionInterface extends SDSExtensionInterface {}
export interface RestInterface<ElementType> {
    rootNode: ObjectNode<ElementType>|undefined;
    setRootNode(obj: ObjectNode<ElementType>): void;
    elementToObjectNode?(data: ElementType, options: RestOptions<ElementType>): Result<ObjectNode<ElementType>>;
    clone?(attrSelector: string): Rest<ElementType>;

    // Hooks
    get?(selector: string): Promise<ObjectNode<ElementType>|null>;
    getAll?(selector: string): Promise<ObjectNode<ElementType>[]>;
    post?(selector: string, data: ElementType, options?: {lilBro?: boolean}): Promise<OkResult>;
    put?(selector: string, data: ObjectNode<ElementType>): Promise<OkResult>;
    patch?<AttrType>(attrSelector: string, data: AttrType): Promise<OkResult>;
    delete?(selector: string): Promise<OkResult>;
}

export interface RestOptions<ElementType> {
    lilBro?: boolean;
    parent?: ObjectNode<ElementType>;
    root?: boolean;
}

export class RestBranchProxy<ElementType> extends SDSProxy implements RestInterface<ElementType> {
    protected _behindData?: Rest<ElementType>;
    private _root: ObjectNode<ElementType>;

    constructor(root: ObjectNode<ElementType>, moduleLink: ModuleLink, description?: string) {
        super(moduleLink, ["post", "getAll"], description);
        this._root = root;
    }

    public setRootNode(obj: ObjectNode<ElementType>) {
        if (this._root === undefined) {
            return;
        }
        this._root.children.forEach(child => child.setParent(obj));
        this._root = obj;
    }

    public get rootNode(): ObjectNode<ElementType>|undefined {
        return this._root;
    }

    public putBehindData?(behindData: Rest<ElementType>): void {
        this._behindData = behindData;
        this._behindData.setRootNode(this._root);
    }

    public async getAll?(selector: string): Promise<ObjectNode<ElementType>[]> {
        return await this._behindData!.getAll!(`${selector}`);
    }

    public async post?(selector: string, data: ElementType, options: Omit<RestOptions<ElementType>, "parent">): Promise<OkResult> {
        return await this._behindData!.post!.bind(this._behindData, `${selector}`, data, options)();
    }
}

/**
 * new Rest(setup, {slots: page.slots}, pageToTreeNode).get("Layout > Welcome")
 */
export class Rest<ElementType> extends SDSService<
    Rest<ElementType>, 
    RestExtensionInterface
> implements RestInterface<ElementType> {
    
    private _options: {adapter: CSSObjectAdapter<ElementType>};
    private _root: ObjectNode<ElementType>;
    private _objectToNodeTree: ObjectToNodeTree<ElementType>;

    constructor(
        object: ElementType,
        objectToTreeNode: ObjectToNodeTree<ElementType>,
        setup: SDSSetup<RestExtensionInterface> = {packageLink: ModuleLink.newPackageURL("", "name")}
    ) {
        super(setup, ["get", "getAll", "post", "put", "patch", "delete", "clone", "elementToObjectNode"]);
        this._options = {adapter: new CSSObjectAdapter()};
        this._objectToNodeTree = objectToTreeNode;
        this._root = this._objectToNodeTree(object, undefined, true);
    }

    public setRootNode(obj: ObjectNode<ElementType>): void {
        this._root.children.forEach(child => child.setParent(obj));
        this._root = obj;
    }

    public get rootNode(): ObjectNode<ElementType> {
        return this._root;
    }

    public elementToObjectNode?(data: ElementType, options: RestOptions<ElementType>): Result<ObjectNode<ElementType>> {
        let treeNode: ObjectNode<ElementType>;
        if (options.root) {
            treeNode = this._objectToNodeTree(data, undefined, true);
        } else if (options.parent) {
            treeNode = this._objectToNodeTree(data, options.parent, false);
        } else {
            treeNode = this._objectToNodeTree(data, undefined, false);
        }
        return Result.ok(treeNode);
    }

    /**
     * Retreive a resource node.
     * @param selector 
     */
    public async get?(selector: string): Promise<ObjectNode<ElementType>|null> {
        return cssSelectOne(selector, [this._root], this._options);
    }

    public async getAll?(selector: string): Promise<ObjectNode<ElementType>[]> {
        return cssSelectAll(selector, [this._root], this._options);
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
     * @param selector Parent or a big brother's link if `options.lilBro` is set true.
     * @param data  Object node's data
     * @param options Set to little bro if you want to set object after the selector.
     * @returns 
     */
    public async post?(selector: string, data: ElementType, options: {lilBro?: boolean} = {lilBro: false}): Promise<OkResult> {
        const parentOrBigBro = await this._getParentOrBigBro(selector, options);
        if (parentOrBigBro.isFailure) {
            return OkResult.fail(`getParent(): ${parentOrBigBro.errorTitle}`, parentOrBigBro.errorDescription!);
        }
        const nodeOptions: RestOptions<ElementType> = {};
        let bigBro: ObjectNode<ElementType>|undefined;
        if (options.lilBro) {
            bigBro = parentOrBigBro.getValue();
            nodeOptions.parent = bigBro.parent! as ObjectNode<ElementType>;
        } else {
            nodeOptions.parent = parentOrBigBro.getValue();
        }

        let newBornChild = this.elementToObjectNode!(data, nodeOptions);
        if (newBornChild.isFailure) {
            return OkResult.fail(`this.elementToObjectNode(): ${newBornChild.errorTitle}`, newBornChild.errorDescription!);
        }
        const posted = this._appendChild(newBornChild.getValue(), bigBro);
        return posted;
    }

    private async _getParentOrBigBro(selector: string, options: {lilBro?: boolean} = {lilBro: false}): Promise<Result<ObjectNode<ElementType>>> {
        let parentOrBigBro = await this.get!(selector);
        if (parentOrBigBro === null) {
            return Result.fail(`Rest.get('${selector}'): not found`, `Please pass the correct elder's selector`);
        }
        if (options.lilBro) {
            if (parentOrBigBro.parent === null) {
                return Result.fail(`Rest('${selector}') is me, and I have no parent to post my lil'bro!`, `Add my parent first. How can I add my sibling if its not my parents.`)
            }
        }
        // not calling lil bro, then its the parents decided to make a love.
        return Result.ok(parentOrBigBro);
    }

    /**
     * Append the data as the child of a parent by calling `data.parent.appendChild()`
     * or `data.parent.setChildren()`.
     * @param newBornChild 
     * @param bigBro 
     */
    private _appendChild(newBornChild: ObjectNode<ElementType>, bigBro?: ObjectNode<ElementType>): OkResult {
        if (bigBro === undefined) {
            newBornChild.parent!.appendChild(newBornChild);
        } else {
            const bigBroIndex = newBornChild.parent!.children.findIndex(sibling => sibling.isEqualTo(bigBro));
            if (bigBroIndex === -1) {
                return OkResult.fail(`Can not find the big bro`, `Are you sure it works?`);
            }
            const elderBrothers = newBornChild.parent!.children.slice(0, bigBroIndex + 1);
            const youngerCousins = newBornChild.parent!.children.slice(bigBroIndex + 1);
            const allChildren: ObjectNodeInterface[] = [...elderBrothers, newBornChild, ...youngerCousins];
            newBornChild.parent!.setChildren(allChildren);
        }
        
        return OkResult.ok();
    }

    /**
     * Update a resource. The selector can not be #document. Which means it must have a parent.
     * @param selector 
     * @param data 
     */
    public async put?(selector: string, data: ObjectNode<ElementType>): Promise<OkResult> {
        let elder = await this.get!(selector);
        if (elder === null) {
            return OkResult.fail(`Rest.get('${selector}'): not found`, `Please pass the correct object selector`);
        } 
        if (elder.parent === null) {
            return OkResult.fail(`Rest.get('${selector}'): parent not found`, `Please pass the correct object selector`);
        }

        const happyFamily: ObjectNodeInterface[] = [];
        for (let siblingIndex = 0; siblingIndex < elder.parent.children.length; siblingIndex++) {
            const sibling: ObjectNodeInterface = elder.parent.children[siblingIndex];
            if (sibling.isEqualTo(elder)) {
                data.setParent(elder.parent);
                happyFamily.push(data);
            } else {
                happyFamily.push(sibling);
            }
        }
        elder.parent.setChildren(happyFamily);
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
        const elem = await this.get!(selector);
        if (elem === null) {
            return OkResult.fail(`Rest.get('${selector}'): not found`, `There is no element with the selector`);
        }
        const attrSetted = elem.setAttribute<AttrType>(attrName!, data);
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
        const els = await this.getAll!(selector);
        if (els.length === 0) {
            return OkResult.ok();
        }
        for (let el of els) {
            if (el.parent === null || el.parent === undefined) {
                continue;
            }
            // If the element has multiple duplicates, we remove only the first element.
            let filtered = false;
            const remainingChildren = el.parent.children.filter((child) => {
                if (filtered) {
                    return true;
                }
                if (child.isEqualTo(el)) {
                    filtered = true;
                    return false;
                }
                return true;
            })
            if (remainingChildren.length !== el.parent.children.length - 1) {
                return OkResult.fail(`Invalid cleared parent`, `Parent must have a one less element`);
            }
            el.parent.setChildren(remainingChildren);
        }
        return OkResult.ok();
    }

    public clone?(attrSelector: string): Rest<ElementType> {
        const clone = new Rest<ElementType>(this._root.getElement()!, this._objectToNodeTree);
        clone._root = this._root;
        clone.delete!(attrSelector);
        return clone;
    }
}