import { ModuleLink, Debug } from "@ara-web/p-hintjens";
import { AstIdentifierMemory } from "./ast-nodes-memory.js";
export class ModuleMemory extends AstIdentifierMemory {
    _moduleLink;
    _glob;
    _content;
    _moduleCategory; // to filter out
    constructor(moduleCategory, moduleLink, glob) {
        super();
        this._moduleLink = moduleLink;
        this._moduleCategory = moduleCategory;
        this._glob = glob;
    }
    print = (filterKey, filterValue) => {
        Debug.push(`Module (${this._moduleLink.toString()})`);
        Debug.log(`Printing the Identifiers`);
        super.print(filterKey, filterValue);
        Debug.pop();
    };
    get moduleCategory() {
        return this._moduleCategory;
    }
    get moduleLink() {
        return this._moduleLink;
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
