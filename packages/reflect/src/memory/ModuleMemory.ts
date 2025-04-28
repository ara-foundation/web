import { Debug } from "@ara-web/ts-enhancement";
import { AstIdentifierMemory } from "./AstIdentifierMemory.js";
import { ModuleLink } from "../ara-link/ModuleLink.js";

export class ModuleMemory<T> extends AstIdentifierMemory {
    private _moduleLink: ModuleLink;
    private _glob: unknown;
    private _content?: T;
    private _moduleCategory: string;    // to filter out

    constructor(moduleCategory: string, moduleLink: ModuleLink, glob: unknown) {
        super()
        this._moduleLink = moduleLink;
        this._moduleCategory = moduleCategory;
        this._glob = glob;
    }

    public print = (filterKey?: string, filterValue?: any): void => {
        Debug.push(`Module (${this._moduleLink.toString()})`)
        Debug.log(`Printing the Identifiers`)
        super.print(filterKey, filterValue);
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

}