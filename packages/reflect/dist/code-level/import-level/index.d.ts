import { Result } from "@ara-web/p-hintjens";
import { TsNode, type AstIdentifiers, type TsNodeValidator } from "../index.js";
export declare class ImportLevel {
    private static _lastImportedTsNode;
    private static _lastImportDeclartion;
    static isImportDeclaration: TsNodeValidator;
    private static _putImportDeclaration;
    /**
     * Return the import clause from `import { moduleName } from '<import clause>';`
     * @param tsNode
     * @returns string literal
     */
    static getImportClause: (tsNode: TsNode) => Promise<Result<string>>;
    static getIdentifiers: (tsNode: TsNode) => Promise<Result<AstIdentifiers>>;
    static getDefaultIdentifier: (tsNode: TsNode) => Promise<Result<string | undefined>>;
}
