import { ModuleLink } from "@ara-web/p-hintjens";
import { AstIdentifierMemory } from "./ast-nodes-memory.js";
export declare class ModuleMemory<T> extends AstIdentifierMemory {
    private _moduleLink;
    private _glob;
    private _content?;
    private _moduleCategory;
    constructor(moduleCategory: string, moduleLink: ModuleLink, glob: unknown);
    print: (filterKey?: string, filterValue?: any) => void;
    get moduleCategory(): string;
    get moduleLink(): ModuleLink;
    get glob(): unknown;
    get content(): T | undefined;
    set content(_content: T);
}
