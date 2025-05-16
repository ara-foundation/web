import { AraLink } from "@ara-web/sds";
import { Debug } from "@ara-web/p-hintjens";
import { 
    CodePieceType, 
    CodePiece, 
    type CodePieceRecord, 
    type CodePieceFilter 
} from "./code-level/index.js";

export abstract class AstIdentifierMemory {
    private _identifiers: CodePieceRecord = {};

    constructor() {
        this._identifiers = {};
    }

    public addIdentifiers = (identifiers: CodePieceRecord) => {
        this._identifiers = {...this._identifiers, ...identifiers}
    }

    public identifiersCount = (): number => {
        if (this._identifiers === undefined) {
            return 0;
        }

        return Object.keys(this._identifiers).length;
    }

    /**Returns the AstNode from memory by given identifier.
     * 
     Adviced to call this method, rather than directly fetching data identifier using this._identifiers.

     Because this method will fetch the referenced ara link.
     Otherwise you have to check that this identifier is not an alias of another identifier.
    */
    public identifierByName = (identifier: string): CodePiece|undefined => {
        if (this._identifiers[identifier] === undefined) {
            return undefined;
        }
            
        // If this identifier is an alias, then as the AstNode return the referenced but with this name.
        if (this._identifiers[identifier] instanceof AraLink) {
            return this.identifierByName(this._identifiers[identifier].resource);
        }
        return this._identifiers[identifier];
    }

    public identifierByType = (identifier: string): CodePiece|undefined => {
        let node = this.identifierByName(identifier);
        if (node === undefined) {
            return node;
        }

        if (node.nodeType !== undefined) {
            return node;
        }
        
        return undefined;
    }

    public getIdentifiers = (filters?: CodePieceFilter[], skippedIdentifiers?: string[]): CodePieceRecord => {
        const identifiers: CodePieceRecord = {};
        const identifierKeys = Object.keys(this._identifiers);

        for (let _identifier of identifierKeys) {
            const node = this.identifierByName(_identifier)
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
                    passedFilters = (filters[filterIteration])(node)
                    if (!passedFilters) {
                        break;
                    }
                }
                if (!passedFilters) {
                    continue;
                }
                identifiers[_identifier] = node!;
                continue;
            }

            
            identifiers[_identifier] = node!;
        }

        return identifiers;
    }

    public identifiersByType = (astNode: CodePieceType): CodePiece[] => {
        const identifiers: CodePiece[] = []
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