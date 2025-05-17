/**
 * Import Declarations in the code.
 * 
 * Works with the ImportDeclaration from the ts-morph, that's why this module is inside the code-level.
 */
import { ImportClause, ImportDeclaration as TsImportDeclaration, Node } from "ts-morph";
import { OkResult, Result, Debug, StringTraits } from "@ara-web/p-hintjens";
import { 
    CodePiece, 
    CodePieceType, 
    type AstNodeFilter,
    Identifier
} from "../index.js";
import { NamedImport } from "./named-import.js";
import { AstNodeTraits } from "../ast-node-traits.js";

// export class ImportDeclaration extends Node {
export class ImportDeclaration {
    private _importClause: string;
    private _defaultIdentifier?: string;
    private _identfiers: CodePiece[] = [];
    protected _tsNode: TsImportDeclaration;

    private constructor (tsNode: TsImportDeclaration) {
        this._tsNode = tsNode;
        this._importClause = '';
    }

    public get importClause(): string {
        return this._importClause;
    }

    public get defaultIdentifier(): string|undefined {
        return this._defaultIdentifier;
    }

    public get codePieces(): CodePiece[] {
        return this._identfiers;
    }

    public static async fromTsNode(tsNode: Node): Promise<Result<ImportDeclaration>> {
        if (!this.isImportDeclaration(tsNode)) {
            return Result.fail(
                `The given node is not import declaration`,
                `Please check the ts node '' is valid import declaration`
            )
        }

        try {
            const importDeclaration = new ImportDeclaration(tsNode as TsImportDeclaration);
            const importClauseIdentified = await importDeclaration.identifyImportClause();
            if (importClauseIdentified.isFailure) {
                return Result.fail(`importDeclaration.identifyImportClause(): ${importClauseIdentified.errorTitle}`, importClauseIdentified.errorDescription!);
            }

            const identifiers = importDeclaration.getIdentifiers();
            if (identifiers.isFailure) {
                return Result.fail(`importDeclaration.getIdentifiers(): ${identifiers.errorTitle}`, identifiers.errorDescription!);
            }
            importDeclaration._identfiers = identifiers.getValue();
            
            return Result.ok(importDeclaration)
        } catch (e) {
            return Result.fail(`new ImportDeclaration()`, `${e}`)
        }
    }

    public static isImportClause: AstNodeFilter = (child: Node): boolean => {
        return child instanceof ImportClause;
    }

    public static isImportDeclaration: AstNodeFilter = (child: Node): boolean => {
        return child instanceof TsImportDeclaration;
    }

    private getNamedImports = (): Node[] => {
        const importSpecifiers = this._tsNode.getChildren();
        if (importSpecifiers.length === 0) {
            return [];
        }

        const tsNodes: Node[] = [];
        for (let importSpecifier of importSpecifiers) {
            if (AstNodeTraits.isNonImportant(importSpecifier)) {
                continue;
            } else if (AstNodeTraits.isString(importSpecifier)) {
                continue;
            } else if (AstNodeTraits.isKeyword(importSpecifier, ["from", "import"])) {
                continue;
            } else if (Identifier.isA(importSpecifier)) {
                continue;
            }
            tsNodes.push(importSpecifier)
        }

        return tsNodes;
    }

    /**
     * Creates a link that this import declaration imports from.
     * @returns {AraLink<string>} Link to the import
     */
    private identifyImportClause = async (): Promise<OkResult> => {
        const children = AstNodeTraits.getChildren(
            this._tsNode,
            [],
            [Identifier.isA, AstNodeTraits.isNonImportant],
            ["import", "from"]
        )
        if (children.length === 0) {
            return OkResult.fail(
                "It can not be empty in the import declaration", 
                "ImportDeclaration doesn't have data, update ImportDeclaration.getModuleLink()"
            )
        }

        for (let tsNode of children) {
            if (ImportDeclaration.isImportClause(tsNode)) {
                const stringNodes = AstNodeTraits.getChildren(tsNode, [AstNodeTraits.isString])
                if (stringNodes.length !== 0) {
                    const importPath = StringTraits.unquote(stringNodes[0].getText());
                    this._importClause = importPath;
                    return OkResult.ok();
                }
            } else if (AstNodeTraits.isString(tsNode)) {
                const importPath = StringTraits.unquote(tsNode.getText());
                this._importClause = importPath;
                return OkResult.ok();
            } else {
                const err = Debug.error(
                    `Unsupported child of import declaration`,
                    `The '${tsNode.getText()}' node is not an import clause nor string literal`,
                    tsNode,
                
                )
                return OkResult.fail(err)
            }
        }

        return OkResult.fail(
            `No import path found`,
            `The import declaration doesn't have the path in '${this._tsNode.getText()}' import declaration`
        )
    }

    /**
     * Syntax to support:
     * import DefaultName from "string-literal-path".
     * @param astImport 
     * @returns 
     */
    private identifyImportDefaultIdentifier = (): Result<CodePiece|undefined> => {
        let nodeType: CodePieceType = CodePieceType.Object;
        const children = AstNodeTraits.getChildren(this._tsNode,
            [],
            [AstNodeTraits.isString, AstNodeTraits.isNonImportant],
            ["import", "from"]
        )
        if (children.length === 0) {
            return Result.fail(
                "It can not be", 
                "ImportDeclaration doesn't have data, check astImport is correct, or update AstNode.getChildren()"
            )
        }

        let identifier: string|undefined = undefined;

        for (let i = 0; i < children.length; i++) {
            const tsNode = children[i];
            if (ImportDeclaration.isImportClause(tsNode)) {
                const identifiers = AstNodeTraits.getChildren(tsNode, [Identifier.isA])
                if (identifiers.length !== 0) {
                    identifier = identifiers[0].getText()
                    
                    const typeKeywords = AstNodeTraits.getChildren(tsNode, [AstNodeTraits.isTypeKeyword])
                    if (typeKeywords.length > 0) {
                        nodeType = CodePieceType.Type;
                    }
                    break;
                }
            } else if (Identifier.isA(tsNode)) {
                identifier = tsNode.getText();
                break;
            } else if (AstNodeTraits.isTypeKeyword(tsNode)) {
                nodeType = CodePieceType.Type;
            } else {
                const err = Debug.error(
                    `Unsupported child of import declaration to determine the default identifier of import`,
                    `The ts node '${this._tsNode.getText()}' has a '${tsNode.getText()}' child that is not import clause`,
                    tsNode,
                )
        
                return Result.fail(err)
            }
        }

        if (identifier === undefined) {
            return Result.ok(undefined)
        }

        const astNode = CodePiece.fromTsNode(this._tsNode);
        astNode.nodeType = nodeType;
        // astNode.data = this._moduleLink!;   // Entire glob
        // astNode.importPath = this._moduleLink!;
        astNode.identifier = identifier;
        astNode.public = false;
        astNode.constant = true;
        this._defaultIdentifier = identifier;

        return Result.ok(astNode);
    }

    /**
     * Import declarations could be named such as:
     * import { name1, name2 } from "string-literal-path".
     * 
     * This function identifies the Ast nodes for each named import identifiers.
     * @param astImport 
     * @param importPath 
     * @returns 
     */
    private identifyNamedImports = (): Result<CodePiece[]> => {
        let identifiers: CodePiece[] = [];
        // Maybe a component is actually defined outside, so its in the imports?
        const namedImports = this.getNamedImports();
        if (namedImports.length === 0) {
            return Result.ok(identifiers)
        }

        for (let namedImport of namedImports) {
            let nodeType = CodePieceType.Object;
            const importClauseChildren = AstNodeTraits.getChildren(namedImport, [], [AstNodeTraits.isNonImportant])
            
            // Debug.push(`NamedImport.getIdentifiers()`, {nodeType, moduleLink: this._moduleLink!.toString(), namedImports: importClauseChildren.length.toString() + " elements"});
            const namedIdentifiers = NamedImport.getIdentifiers(nodeType, importClauseChildren);
            // Debug.pop();
            if (namedIdentifiers.isFailure) {
                return Result.fail(
                    `NamedImport.getIdentifiers('').getIdentifiers(nodeType: '${nodeType}'): ${namedIdentifiers.errorTitle}`,
                    namedIdentifiers.errorDescription!
                )
            }
            identifiers = [...identifiers, ...namedIdentifiers.getValue()]
        }
        
        return Result.ok(identifiers);
    }

    /**
     * Does the given ImportDeclaration holds the definition of the literal?
     * 
     * Import declarations could be default if it's a single literal.
     * 
     * import DefaultName from "string-literla-path"
     * @returns {CodePiece[]}
    */
    private getIdentifiers = (): Result<CodePiece[]> => {
        let identifiers: CodePiece[] = [];

        // Debug.push(`this.identifyNamedImports()`)
        const namedImportIdentifiers = this.identifyNamedImports();
        // Debug.pop();
        if (namedImportIdentifiers.isFailure) {
                return Result.fail(
                    `this.identifyNamedImports(tsNode='${this._tsNode.getText()}', importPath='${this._importClause.toString()}'): ${namedImportIdentifiers.errorTitle}`,
                    namedImportIdentifiers.errorDescription!
                )
        }

        identifiers = [...identifiers, ...namedImportIdentifiers.getValue()];

        let importIdentifier = this.identifyImportDefaultIdentifier();
        
        if (importIdentifier.isFailure) {
            return Result.fail(
                `this.identifyImportDefaultIdentifier('${this._tsNode.getText()}'): ${importIdentifier.errorTitle}`,
                importIdentifier.errorDescription!
            )
        } else if (importIdentifier.getValue() !== undefined) {
            identifiers.push(importIdentifier.getValue()!);
        }
        
        return Result.ok(identifiers);
    }

}