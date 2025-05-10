import { Node } from "ts-morph";
import { OkResult, Result } from "@ara-web/p-hintjens";
import {} from "../index.js";
import { ImportDeclaration } from "./import-declaration.js";
export class ImportLevel {
    // Caching to fetch the data few times.
    static _lastImportedTsNode;
    static _lastImportDeclartion;
    static isImportDeclaration = (tsNode) => {
        return ImportDeclaration.isImportDeclaration(tsNode);
    };
    static _putImportDeclaration = async (tsNode) => {
        if (tsNode === this._lastImportedTsNode) {
            return OkResult.ok();
        }
        if (!this.isImportDeclaration(tsNode)) {
            return OkResult.fail(`this.isImportDeclaration('${tsNode.getText()}'): ts node is not an import declaration`, `Please pass the valid typescript ndoe`);
        }
        const importDeclaration = await ImportDeclaration.fromTsNode(tsNode);
        if (importDeclaration.isFailure) {
            return OkResult.fail(`ImportDeclaration.fromTsNode(tsNode: '${tsNode.getText()}'): ${importDeclaration.errorTitle}`, importDeclaration.errorDescription);
        }
        this._lastImportDeclartion = importDeclaration.getValue();
        this._lastImportedTsNode = tsNode;
        return OkResult.ok();
    };
    /**
     * Return the import clause from `import { moduleName } from '<import clause>';`
     * @param tsNode
     * @returns string literal
     */
    static getImportClause = async (tsNode) => {
        const putted = await this._putImportDeclaration(tsNode);
        if (putted.isFailure) {
            return Result.fail(`this._putImportDeclaration(): ${putted.errorTitle}`, putted.errorDescription);
        }
        return Result.ok(this._lastImportDeclartion.importClause);
    };
    static getIdentifiers = async (tsNode) => {
        const putted = await this._putImportDeclaration(tsNode);
        if (putted.isFailure) {
            return Result.fail(`this._putImportDeclaration(): ${putted.errorTitle}`, putted.errorDescription);
        }
        return Result.ok(this._lastImportDeclartion.codePieces);
    };
    static getDefaultIdentifier = async (tsNode) => {
        const putted = await this._putImportDeclaration(tsNode);
        if (putted.isFailure) {
            return Result.fail(`this._putImportDeclaration(): ${putted.errorTitle}`, putted.errorDescription);
        }
        return Result.ok(this._lastImportDeclartion.defaultIdentifier);
    };
}
