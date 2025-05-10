import { Node } from "ts-morph";
import { Result } from "@ara-web/p-hintjens";
import { type CodePieceRecord, type AstNodeFilter } from "../index.js";
export declare class ImportLevel {
    private static _lastImportedTsNode;
    private static _lastImportDeclartion;
    static isImportDeclaration: AstNodeFilter;
    private static _putImportDeclaration;
    /**
     * Return the import clause from `import { moduleName } from '<import clause>';`
     * @param tsNode
     * @returns string literal
     */
    static getImportClause: (tsNode: Node) => Promise<Result<string>>;
    static getIdentifiers: (tsNode: Node) => Promise<Result<CodePieceRecord>>;
    static getDefaultIdentifier: (tsNode: Node) => Promise<Result<string | undefined>>;
}
