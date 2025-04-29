import { AstNodeType, AstNode, type AstIdentifiers, type AstNodeValidator } from "../code-level/ast-node.js";
export declare abstract class AstIdentifierMemory {
    private _identifiers;
    constructor();
    addIdentifiers: (identifiers: AstIdentifiers) => void;
    identifiersCount: () => number;
    /**Returns the AstNode from memory by given identifier.
     *
     Adviced to call this method, rather than directly fetching data identifier using this._identifiers.

     Because this method will fetch the referenced ara link.
     Otherwise you have to check that this identifier is not an alias of another identifier.
    */
    identifierByName: (identifier: string) => AstNode | undefined;
    identifierByType: (identifier: string) => AstNode | undefined;
    getIdentifiers: (filters?: AstNodeValidator[], skippedIdentifiers?: string[]) => AstIdentifiers;
    identifiersByType: (astNode: AstNodeType) => AstNode[];
    print(filterKey?: string, filterValue?: any): void;
}
