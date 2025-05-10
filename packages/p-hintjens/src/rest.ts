import { selectOne as cssSelectOne } from "css-select"
import { 
    type SDSExtensionInterface, 
    SDSService, 
    type SDSSetup
} from "#sds";
import { OkResult } from "./result.js";
import type { Adapter } from "./traits/index.js";

export interface RestExtensionInterface extends SDSExtensionInterface {}

export class Rest<
    CSSNode, 
    TreeNode extends CSSNode, 
    CSSAdapter extends Adapter<CSSNode, TreeNode>
> extends SDSService<
    Rest<CSSNode, TreeNode, CSSAdapter>, 
    RestExtensionInterface
> {
    private _options: {adapter: CSSAdapter};
    private _nodes: TreeNode[] = [];

    constructor(
        setup: SDSSetup<RestExtensionInterface>, 
        adapter: CSSAdapter,
        treeNodes: TreeNode[]
    ) {
        super(setup, [])
        this._options = {adapter};
        this._nodes = treeNodes;
    }

    /**
     * Retreive a resource node.
     * @param selector 
     */
    public get(selector: string): TreeNode|null {
        return cssSelectOne(selector, this._nodes, this._options);
    }

    /**
     * Create a new resource.
     * 
     * If provided a selector, then it will be assigning the 
     * data into the attribute value.
     * @param selector 
     * @param data 
     */
    public post<AttrType>(selector: string, data: TreeNode|AttrType): OkResult {
        return OkResult.fail(`Not implemented`, `Come back later`);
    }

    /**
     * Update a resource, requires the selector to be
     * without any attributes.
     * @param selector 
     * @param data 
     */
    public put(selector: string, data: TreeNode): OkResult {
        return OkResult.fail(`Not implemented`, `Come back later`);
    }

    /**
     * Make a partial update of a resource.
     * Requires the selector to be with attribute.
     * @param selector 
     * @param data 
     */
    public patch<DataType, AttrType>(selector: string, data: DataType): OkResult {
        return OkResult.fail(`Not implemented`, `Come back later`);
    }

    /**
     * Delete a resource
     * @param selector 
     */
    public delete<DataType>(selector: string): OkResult {
        return OkResult.fail(`Not implemented`, `Come back later`);
    }
}