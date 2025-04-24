import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import { Debug } from "@ara-web/ts-enhancement";
import { AstNodeType, AstNode } from "../code-level/ast-node.js";
import { ReflectAraLink } from "../ara-link/ReflectAraLink.js";
export class AstIdentifierMemory {
    _identifiers = {};
    constructor() {
        this._identifiers = {};
    }
    addIdentifiers = (identifiers) => {
        this._identifiers = { ...this._identifiers, ...identifiers };
    };
    identifiersCount = () => {
        if (this._identifiers === undefined) {
            return 0;
        }
        return Object.keys(this._identifiers).length;
    };
    identifierByAraLink = (araLink) => {
        if (!ReflectAraLink.isIdentifierLink(araLink)) {
            return undefined;
        }
        if (araLink.isEmpty()) {
            return undefined;
        }
        const node = this.identifierByName(ReflectAraLink.getIdentifierResource(araLink));
        return node;
    };
    /**Returns the AstNode from memory by given identifier.
     *
     Adviced to call this method, rather than directly fetching data identifier using this._identifiers.

     Because this method will fetch the referenced ara link.
     Otherwise you have to check that this identifier is not an alias of another identifier.
    */
    identifierByName = (identifier) => {
        if (this._identifiers[identifier] === undefined) {
            return undefined;
        }
        // If this identifier is an alias, then as the AstNode return the referenced but with this name.
        if (this._identifiers[identifier] instanceof AraLink) {
            return this.identifierByAraLink(this._identifiers[identifier]);
        }
        return this._identifiers[identifier];
    };
    identifierByType = (identifier, astNode) => {
        let node = this.identifierByName(identifier);
        if (node === undefined) {
            return node;
        }
        if (node.nodeType !== undefined) {
            return node;
        }
        return undefined;
    };
    getIdentifiers = (filters, skippedIdentifiers) => {
        const identifiers = {};
        const identifierKeys = Object.keys(this._identifiers);
        for (let _identifier of identifierKeys) {
            const node = this.identifierByName(_identifier);
            if (node === undefined) {
                continue;
            }
            if (skippedIdentifiers !== undefined && skippedIdentifiers.length > 0) {
                if (skippedIdentifiers.includes(_identifier)) {
                    continue;
                }
            }
            if (filters !== undefined && filters.length > 0) {
                let passedFilters = true;
                for (let filterIteration = 0; filterIteration < filters.length; filterIteration++) {
                    passedFilters = (filters[filterIteration])(node);
                    if (!passedFilters) {
                        break;
                    }
                }
                if (!passedFilters) {
                    continue;
                }
                identifiers[_identifier] = node;
                continue;
            }
            identifiers[_identifier] = node;
        }
        return identifiers;
    };
    identifiersByType = (astNode) => {
        const identifiers = [];
        const identifierKeys = Object.keys(this._identifiers);
        for (let _identifier of identifierKeys) {
            let node = this.identifierByName(_identifier);
            if (node === undefined) {
                continue;
            }
            if (node.nodeType === astNode) {
                identifiers.push(node);
            }
        }
        return identifiers;
    };
    print(filterKey, filterValue) {
        Debug.push(`Identifier Memory`, { 'filterKey': filterKey, 'filterValue': filterValue });
        Debug.log(`There are ${this.identifiersCount()} identifiers in memory:`);
        for (let identifier in this._identifiers) {
            let node = this._identifiers[identifier];
            if (filterKey !== undefined) {
                Debug.log(`The print memory has a filter: ${filterKey} to match: ${filterValue}`);
                if (Object.keys(node).indexOf(filterKey) === -1) {
                    Debug.log(`The filter key '${filterKey}' doesn't exist in the data`);
                    Debug.log(Object.keys(node));
                    continue;
                }
                if (node[filterKey] !== filterValue) {
                    Debug.log(`Filter '${filterKey}' in node as '${node[filterKey]}' property doesn't match the value: ${filterValue}`);
                    continue;
                }
            }
            Debug.log(`The ${identifier} identifier's node:`);
            Debug.log(node);
            Debug.log(`\t`);
        }
        Debug.pop();
    }
}
