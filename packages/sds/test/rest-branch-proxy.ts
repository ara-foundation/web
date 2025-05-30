import { ModuleLink, ObjectNode, DataToObjectNode, Rest, RestDispatcher, Proxy, Restful } from "../src/index.js";
import { OkResult } from "@ara-web/p-hintjens";

export class RestBranchProxy<ElementType> extends Proxy implements Restful<ElementType> {
    protected _behindData?: Rest<ElementType>;
    private _root: ObjectNode<ElementType>;

    constructor(root: ObjectNode<ElementType>, moduleLink: ModuleLink) {
        super(moduleLink, ["post", "getAll"]);
        this._root = root;
    }
    dataToObjectNode: DataToObjectNode<ElementType>;
    get dispatcher(): RestDispatcher<ElementType> {
        return this._behindData!.dispatcher;
    }

    public get objectToNodeTree(): DataToObjectNode<ElementType> {
        // Return a dummy function to satisfy the type
        return ((element: ElementType, parent?: ObjectNode<ElementType>, isRoot?: boolean) => {
            throw new Error("objectToNodeTree is not implemented in RestBranchProxy.");
        }) as DataToObjectNode<ElementType>;
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

    public async post?(selector: string, data: ElementType): Promise<OkResult> {
        return await this._behindData!.post!.bind(this._behindData, `${selector}`, data)();
    }


    public get dispatchers(): Readonly<RestDispatcher<ElementType>>[] {
        return this._behindData!.extensionOperator.extensions as unknown as RestDispatcher<ElementType>[];
    }
}

