/**
 * Import Declarations in the code.
 *
 * Works with the ImportDeclaration from the ts-morph, that's why this module is inside the code-level.
 */
import { ImportClause, ImportDeclaration as TsImportDeclaration } from "ts-morph";
import { Result } from "@ara-web/ts-enhancement/result";
import { Debug } from "@ara-web/ts-enhancement/debug";
import { StringTraits } from "@ara-web/ts-enhancement/traits";
import { AstNode, AstNodeType } from "./ast-node.js";
import { TsNode } from "./ts-node.js";
import { NamedImport } from "./import-level/named-import.js";
import { Identifier } from "./value-level/idenitifier.js";
import { ModuleLink } from "@ara-web/ts-enhancement/module-link";
import { FilePath } from "../module.js";
export class ImportDeclaration extends TsNode {
    _moduleLink;
    _tsNode;
    constructor(tsNode) {
        super(tsNode);
        this._tsNode = tsNode.getNode();
        this._moduleLink = ModuleLink.newFileURL(import.meta.filename);
    }
    static async fromTsNode(tsNode, callingModulePath, projectMemory) {
        if (!this.isImportDeclaration(tsNode)) {
            return Result.fail(`The given node is not import declaration`, `Please check the ts node '' is valid import declaration`);
        }
        try {
            const importDeclaration = new ImportDeclaration(tsNode);
            const moduleLink = await importDeclaration.getModuleLink(callingModulePath, projectMemory);
            if (moduleLink.isFailure) {
                throw `${moduleLink.errorTitle}: ${moduleLink.errorDescription}`;
            }
            importDeclaration._moduleLink = moduleLink.getValue();
            return Result.ok(importDeclaration);
        }
        catch (e) {
            return Result.fail(`new ImportDeclaration()`, `${e}`);
        }
    }
    static isImportClause = (child) => {
        const node = child.getNode();
        return node instanceof ImportClause;
    };
    static isImportDeclaration = (child) => {
        const node = child.getNode();
        return node instanceof TsImportDeclaration;
    };
    getNamedImports = () => {
        const importSpecifiers = this._tsNode.getChildren();
        if (importSpecifiers.length === 0) {
            return [];
        }
        const tsNodes = [];
        for (let importSpecifier of importSpecifiers) {
            const tsNode = new TsNode(importSpecifier);
            if (TsNode.isNonImportant(tsNode)) {
                continue;
            }
            else if (TsNode.isString(tsNode)) {
                continue;
            }
            else if (TsNode.isKeyword(tsNode, ["from", "import"])) {
                continue;
            }
            else if (Identifier.isA(tsNode)) {
                continue;
            }
            tsNodes.push(tsNode);
        }
        return tsNodes;
    };
    /**
     * Creates a link that this import declaration imports from.
     * @returns {AraLink<string>} Link to the import
     */
    getModuleLink = async (callingModulePath, projectMemory) => {
        const children = this.getChildren([], [Identifier.isA, TsNode.isNonImportant], ["import", "from"]);
        if (children.length === 0) {
            return Result.fail("It can not be empty in the import declaration", "ImportDeclaration doesn't have data, update ImportDeclaration.getModuleLink()");
        }
        for (let tsNode of children) {
            if (ImportDeclaration.isImportClause(tsNode)) {
                const stringNodes = tsNode.getChildren([TsNode.isString]);
                if (stringNodes.length !== 0) {
                    const importPath = StringTraits.unquote(stringNodes[0].getText());
                    const absolueImportPath = await FilePath.getFileAbsolutePath(importPath, callingModulePath.toFilePath);
                    const moduleExists = projectMemory.isModuleExist(absolueImportPath);
                    if (!moduleExists) {
                        return Result.fail(`projectMemory.isModuleExist(): not found`, `The module '${absolueImportPath}' not found in the project memory, please add the module through the extension`);
                    }
                    return Result.ok(absolueImportPath);
                }
            }
            else if (TsNode.isString(tsNode)) {
                const importPath = StringTraits.unquote(tsNode.getText());
                const absolueImportPath = await FilePath.getFileAbsolutePath(importPath, callingModulePath.toFilePath);
                const moduleExists = projectMemory.isModuleExist(absolueImportPath);
                if (!moduleExists) {
                    return Result.fail(`projectMemory.isModuleExist(): not found`, `The module '${absolueImportPath}' not found in the project memory, please add the module through the extension`);
                }
                return Result.ok(absolueImportPath);
            }
            else {
                const err = Debug.error(`Unsupported child of import declaration`, `The '${tsNode.getText()}' node is not an import clause nor string literal`, tsNode);
                return Result.fail(err);
            }
        }
        return Result.fail(`No import path found`, `The import declaration doesn't have the path in '${this.getText()}' import declaration`);
    };
    /**
     * Syntax to support:
     * import DefaultName from "string-literal-path".
     * @param astImport
     * @returns
     */
    identifyImportDefaultIdentifier = () => {
        let nodeType = AstNodeType.Object;
        const children = this.getChildren([], [TsNode.isString, TsNode.isNonImportant], ["import", "from"]);
        if (children.length === 0) {
            return Result.fail("It can not be", "ImportDeclaration doesn't have data, check astImport is correct, or update AstNode.getChildren()");
        }
        let identifier = undefined;
        for (let i = 0; i < children.length; i++) {
            const tsNode = children[i];
            if (ImportDeclaration.isImportClause(tsNode)) {
                const identifiers = tsNode.getChildren([Identifier.isA]);
                if (identifiers.length !== 0) {
                    identifier = identifiers[0].getText();
                    const typeKeywords = tsNode.getChildren([TsNode.isTypeKeyword]);
                    if (typeKeywords.length > 0) {
                        nodeType = AstNodeType.Type;
                    }
                    break;
                }
            }
            else if (Identifier.isA(tsNode)) {
                identifier = tsNode.getText();
                break;
            }
            else if (TsNode.isTypeKeyword(tsNode)) {
                nodeType = AstNodeType.Type;
            }
            else {
                const err = Debug.error(`Unsupported child of import declaration to determine the default identifier of import`, `The ts node '${this.getText()}' has a '${tsNode.getText()}' child that is not import clause`, tsNode);
                return Result.fail(err);
            }
        }
        if (identifier === undefined) {
            return Result.ok(undefined);
        }
        const astNode = AstNode.fromTsNode(this);
        astNode.nodeType = nodeType;
        astNode.data = this._moduleLink; // Entire glob
        astNode.importPath = this._moduleLink;
        astNode.identifier = identifier;
        astNode.public = false;
        astNode.constant = true;
        return Result.ok(astNode);
    };
    /**
     * Import declarations could be named such as:
     * import { name1, name2 } from "string-literal-path".
     *
     * This function identifies the Ast nodes for each named import identifiers.
     * @param astImport
     * @param importPath
     * @returns
     */
    identifyNamedImports = () => {
        let identifiers = {};
        // Maybe a component is actually defined outside, so its in the imports?
        const namedImports = this.getNamedImports();
        if (namedImports.length === 0) {
            return Result.ok(identifiers);
        }
        for (let namedImport of namedImports) {
            let nodeType = AstNodeType.Object;
            const importClauseChildren = namedImport.getChildren([], [TsNode.isNonImportant]);
            // Debug.push(`NamedImport.getIdentifiers()`, {nodeType, moduleLink: this._moduleLink!.toString(), namedImports: importClauseChildren.length.toString() + " elements"});
            const namedIdentifiers = NamedImport.getIdentifiers(nodeType, this._moduleLink, importClauseChildren);
            // Debug.pop();
            if (namedIdentifiers.isFailure) {
                return Result.fail(`NamedImport.getIdentifiers('').getIdentifiers(nodeType: '${nodeType}', moduleLink: '${this._moduleLink.toString()}'): ${namedIdentifiers.errorTitle}`, namedIdentifiers.errorDescription);
            }
            identifiers = { ...identifiers, ...namedIdentifiers.getValue() };
        }
        return Result.ok(identifiers);
    };
    /**
     * Does the given ImportDeclaration holds the definition of the literal?
     *
     * Import declarations could be default if it's a single literal.
     *
     * import DefaultName from "string-literla-path"
     * @returns {AstIdentifiers}
    */
    getIdentifiers = () => {
        let identifiers = {};
        // Debug.push(`this.identifyNamedImports()`)
        const namedImportIdentifiers = this.identifyNamedImports();
        // Debug.pop();
        if (namedImportIdentifiers.isFailure) {
            return Result.fail(`this.identifyNamedImports(tsNode='${this.getText()}', importPath='${this._moduleLink.toString()}'): ${namedImportIdentifiers.errorTitle}`, namedImportIdentifiers.errorDescription);
        }
        identifiers = { ...identifiers, ...namedImportIdentifiers.getValue() };
        let importIdentifier = this.identifyImportDefaultIdentifier();
        if (importIdentifier.isFailure) {
            return Result.fail(`this.identifyImportDefaultIdentifier('${this.getText()}'): ${importIdentifier.errorTitle}`, importIdentifier.errorDescription);
        }
        else if (importIdentifier.getValue() !== undefined) {
            identifiers[importIdentifier.getValue().identifier] = importIdentifier.getValue();
        }
        return Result.ok(identifiers);
    };
}
