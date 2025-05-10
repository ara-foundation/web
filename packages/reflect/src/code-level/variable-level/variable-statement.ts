/**
 * Import Declarations in the code.
 * 
 * Works with the ImportDeclaration from the ts-morph, that's why this module is inside the code-level.
 */
import { 
    VariableStatement as TsVariableStatement, 
    VariableDeclarationList,
    Node
} from "ts-morph";
import { Debug, Result } from "@ara-web/p-hintjens";
import { AstNodeTraits, type AstNodeFilter, type CodePieceRecord } from "../index.js";
import { VariableDeclaration } from "./variable-declaration.js";

export class VariableStatement {
    protected _tsNode: TsVariableStatement;
    private _astNodes: CodePieceRecord = {};

    private constructor (tsNode: Node) {
        this._tsNode = tsNode as TsVariableStatement;
    }

    public static async fromTsNode(tsNode: Node): Promise<Result<VariableStatement>> {
        if (!this.isVariableStatement(tsNode)) {
            return Result.fail(
                `The given node is not a variable statement`,
                `Please check the ts node`
            )
        }
        const varStatement = new VariableStatement(tsNode);

        const astNodes = await varStatement.identifyAstNodes();
        if (astNodes.isFailure) {
            return Result.fail(
                `varStatement.identifyAstNodes(): ${astNodes.errorTitle}`,
                astNodes.errorDescription!
            )
        }
        varStatement._astNodes = astNodes.getValue();

        return Result.ok(varStatement)
    }

    public static isVariableStatement: AstNodeFilter = (node: Node): boolean => {
        return node instanceof TsVariableStatement;
    }

    public static isVariableDeclarationList: AstNodeFilter = (node: Node): boolean => {
        return node instanceof VariableDeclarationList;
    }

    public static isNonImportantKeyword: AstNodeFilter = (node: Node): boolean => {
        return ["var", "let"].includes(node.getText());
    }
    
    
    /**
     * Returns the variable's identifier
     */
    public getAstIdentifiers = (): CodePieceRecord => {
        return this._astNodes;
    }

    /**
     * Variable declaration comes as "var <declaration>" or "let <declaration>"
     * @param tsNode 
     * @param publicFlag Indicates whether the ast nodes are public or not 
     * @returns 
     */
    private identifyVariableDeclarationList = async (tsNode: Node, publicFlag: boolean): Promise<Result<CodePieceRecord>> => {
        let identifiers: CodePieceRecord = {};
        const children = AstNodeTraits.getChildren(tsNode, [], [AstNodeTraits.isNonImportant, VariableStatement.isNonImportantKeyword])
        const childCount = children.length;

        let nodeFlags = {
            public: publicFlag,
            constant: false,
        }
    
        for (let i = 0; i < childCount; i++) {
            const varChild = children[i];
            if (AstNodeTraits.isConstKeyword(varChild)) {
                nodeFlags.constant = true;
                continue;
            } else if (!AstNodeTraits.isSyntaxList(varChild)) {
                const err = Debug.error(
                    `Unsupported ${i}/${childCount-1} child`,
                    `The variable declaration's ${i}/${childCount-1} child '${varChild.getText()}' is not supported by Ara Web, update identifyVariableDeclarationList()`,
                    varChild,
                )
                return Result.fail(err);
            }
    
            const syntaxList = AstNodeTraits.getChildren(varChild, [], [AstNodeTraits.isNonImportant], [","]);
            if (syntaxList.length === 0) {
                return Result.fail(
                    `The syntax list of variable declaration list is empty`,
                    `Probably one of the variable declaration statement's child nodes didn't have the 'continue', 'return' or 'break' and it passes to here. Update the identifyVariableDeclarationList()`
                )
            }
            
            for (let varDeclarationCounter = 0; varDeclarationCounter < syntaxList.length; varDeclarationCounter++) {
                const varDeclarationTsNode = syntaxList[varDeclarationCounter];

                if (!VariableDeclaration.isVariableDeclaration(varDeclarationTsNode)) {
                    const err = Debug.error(
                        `The child of syntax list is not variable declaration`,
                        `Only VariableDeclaration is expected`,
                        varDeclarationTsNode,
                    )
                    return Result.fail(err)
                }

                const varDeclaration = VariableDeclaration.fromTsNode(varDeclarationTsNode, nodeFlags)
                if (varDeclaration.isFailure) {
                    const err = Debug.error(
                        `VariableDeclaration.fromTsNode(tsNode: '${varDeclarationTsNode.getText()}'): ${varDeclaration.errorTitle}`,
                        varDeclaration.errorDescription!,
                        varDeclaration,
                    )
                    return Result.fail(err)
                }

                const astNodes = await varDeclaration.getValue().getAstIdentifiers();

                if (astNodes.isFailure) {
                    return Result.fail(
                        `varDeclaration('${varDeclarationTsNode.getText()}').getAstIdentifiers(): ${astNodes.errorTitle}`,
                        astNodes.errorDescription!
                    )
                }
        
                identifiers = {...identifiers, ...astNodes.getValue()}
            }
        }
    
        return Result.ok(identifiers);
    }

    /**
     * Get the variable declaration from the variable statement
     * @param varStatement 
     * @param memory 
     * @returns 
     */
    private identifyAstNodes = async (): Promise<Result<CodePieceRecord>> => {
        let publicFlag = false;
        
        const children = AstNodeTraits.getChildren(this._tsNode, [], [AstNodeTraits.isNonImportant]);
        const childCount = children.length;
        for (let i = 0; i < childCount; i++) {
            const varChild = children[i];
            if (AstNodeTraits.isExportKeyword(varChild)) {
                publicFlag = true;
            } else if (VariableStatement.isVariableDeclarationList(varChild)) {
                // Debug.push(`identifyVariableDeclarationList()`, {'varDeclaration': varChild.getText(), 'identifierNode': JSON.stringify(identifier)})
                const identified = await this.identifyVariableDeclarationList(varChild, publicFlag);
                // Debug.pop();
                if (identified.isFailure) {
                    return Result.fail(
                        `this.identifyVariableDeclarationList(varDeclaration: '${varChild.getText()}'): ${identified.errorTitle}`,
                        identified.errorDescription!
                    )
                }
                return identified;
            } else {
                const err = Debug.error(
                    `The ${i}/${childCount - 1} child is not supported by Ara Web`,
                    `The '${varChild.getText()}' child node is not supported by Ara Web, change the identifyVariableDeclaration()`,
                    varChild
                )
                return Result.fail(err)
            }
        }
    
        return Result.fail(
            `Couldn't find the variable declaration`,
            `The identification of the variable failed`
        )
    }
    
}