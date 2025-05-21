import { OkResult } from "@ara-web/p-hintjens";
import { ObjectNode, Rest, SDSProxy } from "@ara-web/sds";
import { type ReflectElementType } from "./reflect-object-tree.js";
export declare class RestReflectHookProxy extends SDSProxy {
    private _rest?;
    constructor();
    putBehindData(behindData: Rest<ReflectElementType>): void;
    getAll?(selector: string): Promise<ObjectNode<ReflectElementType>[]>;
    post?(selector: string, data: ReflectElementType, options?: {
        lilBro?: boolean;
    }): Promise<OkResult>;
    get?(selector: string): Promise<ObjectNode<ReflectElementType> | null>;
    put?(selector: string, data: ObjectNode<ReflectElementType>): Promise<OkResult>;
    patch?<AttrType>(attrSelector: string, data: AttrType): Promise<OkResult>;
    delete?(selector: string): Promise<OkResult>;
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
