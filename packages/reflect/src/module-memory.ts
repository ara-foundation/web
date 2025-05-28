import { ModuleLink, Rest } from "@ara-web/sds";
import type { CodePiece } from "./code-level/index.js";
import { moduleToCodePieceTree } from "./code-piece-object-tree.js";

export class ModuleMemory<T> {
    private _moduleLink: ModuleLink;
    private _glob: unknown;
    private _content?: T;
    private _moduleCategory: string;    // to filter out
    private _rest: Rest<CodePiece>;

    constructor(moduleCategory: string, moduleLink: ModuleLink, glob: unknown) {
        this._moduleLink = moduleLink;
        this._moduleCategory = moduleCategory;
        this._glob = glob;
        this._rest = new Rest<CodePiece>({} as CodePiece, moduleToCodePieceTree);
    }

    public get moduleCategory(): string {
        return this._moduleCategory;
    }

    public get moduleLink(): ModuleLink {
        return this._moduleLink;
    } 
    
    public get glob(): unknown {
        return this._glob;
    } 

    public get content(): T|undefined {
        return this._content;
    }

    public set content(_content: T) {
        this._content = _content;
    }

    public get rest (): Rest<CodePiece> {
        return this._rest;
    }

}