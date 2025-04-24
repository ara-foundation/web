import { AstIdentifierMemory } from "./AstIdentifierMemory.js";
import type { ModuleType } from "../module.js";
export declare class ModuleMemory<T> extends AstIdentifierMemory {
    private _moduleType;
    private _modulePath;
    private _glob;
    private _content?;
    constructor(moduleType: ModuleType, modulePath: string, glob: unknown);
    print: (filterKey?: string, filterValue?: any) => void;
    get moduleType(): ModuleType;
    get modulePath(): string;
    get glob(): unknown;
    get content(): T | undefined;
    set content(_content: T);
}
