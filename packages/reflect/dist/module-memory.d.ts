import { ModuleLink, Rest } from "@ara-web/sds";
import type { CodePiece } from "./code-level/index.js";
export declare class ModuleMemory<T> {
    private _moduleLink;
    private _glob;
    private _content?;
    private _moduleCategory;
    private _rest;
    constructor(moduleCategory: string, moduleLink: ModuleLink, glob: unknown);
    get moduleCategory(): string;
    get moduleLink(): ModuleLink;
    get glob(): unknown;
    get content(): T | undefined;
    set content(_content: T);
    get rest(): Rest<CodePiece>;
}
