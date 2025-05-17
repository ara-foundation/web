import { ModuleLink, Rest } from "@ara-web/sds";
import { Debug } from "@ara-web/p-hintjens";
import type { CodePiece } from "./code-level/index.js";
import { moduleToObjectTree } from "./code-piece-object-tree.js";

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
        this._rest = new Rest<CodePiece>({} as CodePiece, moduleToObjectTree);
    }

    public print = (filterKey?: string, filterValue?: any): void => {
        Debug.push(`Module (${this._moduleLink.toString()})`)
        Debug.log(`Printing the Identifiers`)
        Debug.pop();
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