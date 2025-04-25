import { AstIdentifierMemory } from "./AstIdentifierMemory.js";
import type { ModuleLink } from "../ara-link/ReflectAraLink.js";
export declare class ModuleMemory<T> extends AstIdentifierMemory {
    private _moduleLink;
    private _glob;
    private _content?;
    constructor(moduleLink: ModuleLink, glob: unknown);
    print: (filterKey?: string, filterValue?: any) => void;
    get moduleLink(): ModuleLink;
    get glob(): unknown;
    get content(): T | undefined;
    set content(_content: T);
}
