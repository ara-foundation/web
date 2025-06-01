import { OkResult } from "@ara-web/p-hintjens";
import { ObjectNode, Rest, RestHandler, Proxy, type DataToObjectNode, type Restful, RestDispatcher } from "@ara-web/sds";
import { type ReflectDataType } from "./reflect-object-tree.js";
export declare class RestReflectHookProxy extends Proxy implements Restful<ReflectDataType> {
    private _rest?;
    constructor();
    get rootNode(): ObjectNode<ReflectDataType> | undefined;
    setRootNode(obj: ObjectNode<ReflectDataType>): void;
    get handlers(): Readonly<RestHandler>[];
    get dispatcher(): RestDispatcher<ReflectDataType>;
    get dataToObjectNode(): DataToObjectNode<ReflectDataType>;
    putBehindData(behindData: Rest<ReflectDataType>): void;
    getAll?(selector: string): Promise<ObjectNode<ReflectDataType>[]>;
    post?(selector: string, data: ReflectDataType, options?: {
        lilBro?: boolean;
    }): Promise<OkResult>;
    get?(selector: string): Promise<ObjectNode<ReflectDataType> | null>;
    put?(selector: string, data: ReflectDataType): Promise<OkResult>;
    patch?<AttrType>(attrSelector: string, data: AttrType): Promise<OkResult>;
    delete?(selector: string): Promise<OkResult>;
    private beforeAny;
    /**
     * Call extensions
     */
    private beforeGet;
    private afterGet;
    private beforePost;
    private afterPost;
    private beforePut;
    private afterPut;
    private beforePatch;
    private afterPatch;
    private beforeDelete;
    private afterDelete;
}
