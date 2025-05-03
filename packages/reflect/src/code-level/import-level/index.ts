import { OkResult, Result } from "@ara-web/p-hintjens";
import { TsNode, type AstIdentifiers, type TsNodeValidator } from "../index.js";
import { ImportDeclaration } from "./import-declaration.js";

export class ImportLevel {
    // Caching to fetch the data few times.
    private static _lastImportedTsNode: TsNode;
    private static _lastImportDeclartion: ImportDeclaration;

    public static isImportDeclaration: TsNodeValidator = (tsNode: TsNode): boolean => {
        return ImportDeclaration.isImportDeclaration(tsNode);
    }

    private static _putImportDeclaration = async (tsNode: TsNode): Promise<OkResult> => {
        if (tsNode === this._lastImportedTsNode) {
            return OkResult.ok();
        }
    
        if (!this.isImportDeclaration(tsNode)) {
            return OkResult.fail(
                `this.isImportDeclaration('${tsNode.getText()}'): ts node is not an import declaration`,
                `Please pass the valid typescript ndoe`
            )
        }

        const importDeclaration = await ImportDeclaration.fromTsNode(tsNode);
        if (importDeclaration.isFailure) {
            return OkResult.fail(
                `ImportDeclaration.fromTsNode(tsNode: '${tsNode.getText()}'): ${importDeclaration.errorTitle}`,
                importDeclaration.errorDescription!
            )
        }
        this._lastImportDeclartion = importDeclaration.getValue();
        this._lastImportedTsNode = tsNode;
    
        return OkResult.ok();
    }

    /**
     * Return the import clause from `import { moduleName } from '<import clause>';`
     * @param tsNode 
     * @returns string literal
     */
    public static getImportClause = async (tsNode: TsNode): Promise<Result<string>> => {
        const putted = await this._putImportDeclaration(tsNode);
        if (putted.isFailure) {
            return Result.fail(
                `this._putImportDeclaration(): ${putted.errorTitle}`,
                putted.errorDescription!
            )
        }

        return Result.ok(this._lastImportDeclartion.importClause);
    }

    public static getIdentifiers = async (tsNode: TsNode): Promise<Result<AstIdentifiers>> => {
        const putted = await this._putImportDeclaration(tsNode);
        if (putted.isFailure) {
            return Result.fail(
                `this._putImportDeclaration(): ${putted.errorTitle}`,
                putted.errorDescription!
            )
        }

        return Result.ok(this._lastImportDeclartion.astIdentifiers);
    }

    public static getDefaultIdentifier = async (tsNode: TsNode): Promise<Result<string|undefined>> => {
        const putted = await this._putImportDeclaration(tsNode);
        if (putted.isFailure) {
            return Result.fail(
                `this._putImportDeclaration(): ${putted.errorTitle}`,
                putted.errorDescription!
            )
        }

        return Result.ok(this._lastImportDeclartion.defaultIdentifier);
    }
}