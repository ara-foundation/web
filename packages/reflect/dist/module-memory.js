import { ModuleLink, Rest } from "@ara-web/sds";
import { Debug } from "@ara-web/p-hintjens";
import { moduleToObjectTree } from "./code-piece-object-tree.js";
export class ModuleMemory {
    _moduleLink;
    _glob;
    _content;
    _moduleCategory; // to filter out
    _rest;
    constructor(moduleCategory, moduleLink, glob) {
        this._moduleLink = moduleLink;
        this._moduleCategory = moduleCategory;
        this._glob = glob;
        this._rest = new Rest({}, moduleToObjectTree);
    }
    print = (filterKey, filterValue) => {
        Debug.push(`Module (${this._moduleLink.toString()})`);
        Debug.log(`Printing the Identifiers`);
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
    get rest() {
        return this._rest;
    }
}
