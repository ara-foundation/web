import { AraLink } from "@ara-web/ara-link";
import { Debug } from "@ara-web/ts-enhancement";
import { AstNodeType, type IdentifiedNode, type Identifiers } from "../codeLevel/types.js";
import { ReflectAraLink } from "../araLink/ReflectAraLink.js";

export abstract class IdentifierMemory {
    private _identifiers: Identifiers = {};

    constructor() {
        this._identifiers = {};
    }

    public addIdentifiers = (identifiers: Identifiers) => {
        this._identifiers = {...this._identifiers, ...identifiers}
    }

    public identifiersCount = (): number => {
        if (this._identifiers === undefined) {
            return 0;
        }

        return Object.keys(this._identifiers).length;
    }

    public identifierByAraLink = (araLink: AraLink<string>): IdentifiedNode|undefined => {
        if (!ReflectAraLink.isIdentifierLink(araLink)) {
            return undefined;
        }

        if (araLink.isEmpty()) {
            return undefined;
        }
        const identifier = araLink.resource as string;
        const node = this.identifierByName(identifier);
        if (node === undefined) {
            return undefined;
        }

        return node;
    }

    public identifierByName = (identifier: string): IdentifiedNode|undefined => {
        for (let _identifier in this._identifiers) {
            if (_identifier === identifier) {
                return this._identifiers[_identifier];
            }
        }
        
        return undefined;
    }

    public identifierByType = (identifier: string, astNode: AstNodeType): IdentifiedNode|undefined => {
        const node = this.identifierByName(identifier);
        if (node === undefined) {
            return node;
        }

        if (node.nodeType === astNode) {
            return node;
        }
        
        return undefined;
    }

    public identifiersByType = (astNode: AstNodeType): IdentifiedNode[] => {
        const identifiers: IdentifiedNode[] = []

        for (let _identifier in this._identifiers) {
            const node = this._identifiers[_identifier];
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