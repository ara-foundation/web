import { Debug } from "@ara-web/ts-enhancement";
import { AstIdentifierMemory } from "./AstIdentifierMemory.js";
export class ModuleMemory extends AstIdentifierMemory {
    _moduleType;
    _modulePath;
    _glob;
    _content;
    constructor(moduleType, modulePath, glob) {
        super();
        this._moduleType = moduleType;
        this._modulePath = modulePath;
        this._glob = glob;
    }
    print = (filterKey, filterValue) => {
        Debug.push(`Module (${this._modulePath}) '${this._moduleType}'`);
        Debug.log(`Printing the Identifiers`);
        super.print(filterKey, filterValue);
        Debug.pop();
    };
    get moduleType() {
        return this._moduleType;
    }
    get modulePath() {
        return this._modulePath;
    }
    get glob() {
        return this._glob;
    }
    get content() {
        return this._content;
    }
    set content(_content) {
        this._content = _content;
    }
}
