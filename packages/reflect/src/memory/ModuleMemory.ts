import { Debug } from "@ara-web/ts-enhancement";
import { IdentifierMemory } from "./IdentifierMemory.js";
import type { ModuleType } from "../module.js";
import type { FileContent } from "../fileLevel.js";

export class ModuleMemory<T> extends IdentifierMemory {
    private _moduleType: ModuleType;
    private _modulePath: string;
    private _glob: unknown;
    private _fileContent?: FileContent;
    private _content?: T;

    constructor(moduleType: ModuleType, modulePath: string, glob: unknown) {
        super()
        this._moduleType = moduleType;
        this._modulePath = modulePath;
        this._glob = glob;
    }

    public print = (filterKey?: string, filterValue?: any): void => {
        Debug.push(`Module (${this._modulePath}) '${this._moduleType}'`)
        Debug.log(`Printing the Identifiers`)
        super.print(filterKey, filterValue);
        Debug.pop();
    }

    public get moduleType(): ModuleType {
        return this._moduleType;
    } 

    public get modulePath(): string {
        return this._modulePath;
    } 
    
    public get glob(): unknown {
        return this._glob;
    } 

    public get fileContent(): FileContent|undefined {
        return this._fileContent;
    }

    public set fileContent(file: FileContent) {
        this._fileContent = file;
    }

    public get content(): T|undefined {
        return this._content;
    }

    public set content(_content: T) {
        this._content = _content;
    }

}