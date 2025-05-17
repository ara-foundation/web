import { CodePieceType, CodePiece, type CodePieceFilter } from "./code-level/index.js";
export declare abstract class CodePieceMemory_ {
    constructor();
    /**Returns the AstNode from memory by given identifier.
     *
     Adviced to call this method, rather than directly fetching data identifier using this._identifiers.

     Because this method will fetch the referenced ara link.
     Otherwise you have to check that this identifier is not an alias of another identifier.
    */
    identifierByName: (identifier: string) => CodePiece | undefined;
    identifierByType: (identifier: string) => CodePiece | undefined;
    getIdentifiers: (filters?: CodePieceFilter[], skippedIdentifiers?: string[]) => CodePiece[];
    identifiersByType: (astNode: CodePieceType) => CodePiece[];
    print(filterKey?: string, filterValue?: any): void;
}
