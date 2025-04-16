import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import { Debug } from "@ara-web/ts-enhancement";
import { AstNodeType, AstNode, type AstIdentifiers, type AstNodeValidater } from "../code-level/ast-node.js";
import { ReflectAraLink } from "../araLink/ReflectAraLink.js";


export abstract class AstIdentifierMemory {
    private _identifiers: AstIdentifiers = {};

    constructor() {
        this._identifiers = {};
    }

    public addIdentifiers = (identifiers: AstIdentifiers) => {
        this._identifiers = {...this._identifiers, ...identifiers}
    }

    public identifiersCount = (): number => {
        if (this._identifiers === undefined) {
            return 0;
        }

        return Object.keys(this._identifiers).length;
    }

    public identifierByAraLink = (araLink: AraLink<string>): AstNode|undefined => {
        if (!ReflectAraLink.isIdentifierLink(araLink)) {
            return undefined;
        }

        if (araLink.isEmpty()) {
            return undefined;
        }
        const identifier = araLink.resource as string;
        const node = this.identifierByName(identifier);
        return node;
    }

    /**Returns the AstNode from memory by given identifier.
     * 
     Adviced to call this method, rather than directly fetching data identifier using this._identifiers.

     Because this method will fetch the referenced ara link.
     Otherwise you have to check that this identifier is not an alias of another identifier.
    */
    public identifierByName = (identifier: string): AstNode|undefined => {
        if (this._identifiers[identifier] === undefined) {
            return undefined;
        }
            
        // If this identifier is an alias, then as the AstNode return the referenced but with this name.
        if (this._identifiers[identifier] instanceof AraLink) {
            return this.identifierByAraLink(this._identifiers[identifier]);
        }
        return this._identifiers[identifier];
    }

    public identifierByType = (identifier: string, astNode: AstNodeType): AstNode|undefined => {
        let node = this.identifierByName(identifier);
        if (node === undefined) {
            return node;
        }

        if (node.nodeType !== undefined) {
            return node;
        }
        
        return undefined;
    }

    public getIdentifiers = (filters?: AstNodeValidater[]): AstIdentifiers => {
        const identifiers: AstIdentifiers = {};
        const identifierKeys = Object.keys(this._identifiers);

        for (let _identifier of identifierKeys) {
            const node = this.identifierByName(_identifier)
            
            if (node === undefined) {
                continue;
            }

            if (filters === undefined || filters.length === 0) {
                continue;
            }
            let passedFilters = true;
            for (let filterIteration = 0; filterIteration < filters.length; filterIteration++) {
                passedFilters = (filters[filterIteration])(node)
                if (!passedFilters) {
                    break;
                }
            }
            if (!passedFilters) {
                continue;
            }

            identifiers[_identifier] = node!;
        }

        return identifiers;
    }

    public identifiersByType = (astNode: AstNodeType): AstNode[] => {
        const identifiers: AstNode[] = []
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
    }

    public print (filterKey?: string, filterValue?: any): void {
        Debug.push(`Identifier Memory`, {'filterKey': filterKey!, 'filterValue': filterValue})
        Debug.log(`There are ${this.identifiersCount()} identifiers in memory:`);
        for (let identifier in this._identifiers) {
            let node = this._identifiers[identifier];
            if (filterKey !== undefined) {
                Debug.log(`The print memory has a filter: ${filterKey} to match: ${filterValue}`)
                if (Object.keys(node).indexOf(filterKey) === -1) {
                    Debug.log(`The filter key '${filterKey}' doesn't exist in the data`)
                    Debug.log(Object.keys(node))
                    continue;
                }
                if (node[filterKey as keyof typeof node] !== filterValue) {
                    Debug.log(`Filter '${filterKey}' in node as '${node[filterKey as keyof typeof node]}' property doesn't match the value: ${filterValue}`)
                    continue;
                }
            }
            Debug.log(`The ${identifier} identifier's node:`)
            Debug.log(node)
            Debug.log(`\t`)
        }
        Debug.pop();
    }
}