/**
 * Import Declarations in the code.
 *
 * Works with the ImportDeclaration from the ts-morph, that's why this module is inside the code-level.
 */
import { VariableStatement as TsVariableStatement, VariableDeclarationList, Node } from "ts-morph";
import { Result, Debug } from "@ara-web/ts-enhancement";
import { TsNode } from "../ts-node.js";
import {} from "../ast-node.js";
import { VariableDeclaration } from "./variable-declaration.js";
export class VariableStatement extends TsNode {
    _tsNode;
    _astNodes = {};
    constructor(tsNode) {
        super(tsNode);
        this._tsNode = tsNode.getNode();
    }
    static async fromTsNode(tsNode) {
        if (!this.isVariableStatement(tsNode)) {
            return Result.fail(`The given node is not a variable statement`, `Please check the ts node`);
        }
        const varStatement = new VariableStatement(tsNode);
        const astNodes = await varStatement.identifyAstNodes();
        if (astNodes.isFailure) {
            return Result.fail(`varStatement.identifyAstNodes(): ${astNodes.errorTitle}`, astNodes.errorDescription);
        }
        varStatement._astNodes = astNodes.getValue();
        return Result.ok(varStatement);
    }
    static isVariableStatement = (child) => {
        const node = child.getNode();
        return node instanceof TsVariableStatement;
    };
    static isVariableDeclarationList = (child) => {
        const node = child.getNode();
        return node instanceof VariableDeclarationList;
    };
    static isNonImportantKeyword = (child) => {
        return ["var", "let"].includes(child.getText());
    };
    /**
     * Returns the variable's identifier
     */
    getAstIdentifiers = () => {
        return this._astNodes;
    };
    /**
     * Variable declaration comes as "var <declaration>" or "let <declaration>"
     * @param tsNode
     * @param publicFlag Indicates whether the ast nodes are public or not
     * @returns
     */
    identifyVariableDeclarationList = async (tsNode, publicFlag) => {
        let identifiers = {};
        const children = tsNode.getChildren([], [TsNode.isNonImportant, VariableStatement.isNonImportantKeyword]);
        const childCount = children.length;
        let nodeFlags = {
            public: publicFlag,
            constant: false,
        };
        for (let i = 0; i < childCount; i++) {
            const varChild = children[i];
            if (TsNode.isConstKeyword(varChild)) {
                nodeFlags.constant = true;
                continue;
            }
            else if (!TsNode.isSyntaxList(varChild)) {
                const err = Debug.error(`Unsupported ${i}/${childCount - 1} child`, `The variable declaration's ${i}/${childCount - 1} child '${varChild.getText()}' is not supported by Ara Web, update identifyVariableDeclarationList()`, varChild);
                return Result.fail(err);
            }
            const syntaxList = varChild.getChildren([], [TsNode.isNonImportant], [","]);
            if (syntaxList.length === 0) {
                return Result.fail(`The syntax list of variable declaration list is empty`, `Probably one of the variable declaration statement's child nodes didn't have the 'continue', 'return' or 'break' and it passes to here. Update the identifyVariableDeclarationList()`);
            }
            for (let varDeclarationCounter = 0; varDeclarationCounter < syntaxList.length; varDeclarationCounter++) {
                const varDeclarationTsNode = syntaxList[varDeclarationCounter];
                if (!VariableDeclaration.isVariableDeclaration(varDeclarationTsNode)) {
                    const err = Debug.error(`The child of syntax list is not variable declaration`, `Only VariableDeclaration is expected`, varDeclarationTsNode);
                    return Result.fail(err);
                }
                const varDeclaration = VariableDeclaration.fromTsNode(varDeclarationTsNode, nodeFlags);
                if (varDeclaration.isFailure) {
                    const err = Debug.error(`VariableDeclaration.fromTsNode(tsNode: '${varDeclarationTsNode.getText()}'): ${varDeclaration.errorTitle}`, varDeclaration.errorDescription, varDeclaration);
                    return Result.fail(err);
                }
                const astNodes = await varDeclaration.getValue().getAstIdentifiers();
                if (astNodes.isFailure) {
                    return Result.fail(`varDeclaration('${varDeclaration.getValue().getText()}').getAstIdentifiers(): ${astNodes.errorTitle}`, astNodes.errorDescription);
                }
                identifiers = { ...identifiers, ...astNodes.getValue() };
            }
        }
        return Result.ok(identifiers);
    };
    /**
     * Get the variable declaration from the variable statement
     * @param varStatement
     * @param memory
     * @returns
     */
    identifyAstNodes = async () => {
        let publicFlag = false;
        const children = this.getChildren([], [TsNode.isNonImportant]);
        const childCount = children.length;
        for (let i = 0; i < childCount; i++) {
            const varChild = children[i];
            if (TsNode.isExportKeyword(varChild)) {
                publicFlag = true;
            }
            else if (VariableStatement.isVariableDeclarationList(varChild)) {
                // Debug.push(`identifyVariableDeclarationList()`, {'varDeclaration': varChild.getText(), 'identifierNode': JSON.stringify(identifier)})
                const identified = await this.identifyVariableDeclarationList(varChild, publicFlag);
                // Debug.pop();
                if (identified.isFailure) {
                    return Result.fail(`this.identifyVariableDeclarationList(varDeclaration: '${varChild.getText()}'): ${identified.errorTitle}`, identified.errorDescription);
                }
                return identified;
            }
            else {
                const err = Debug.error(`The ${i}/${childCount - 1} child is not supported by Ara Web`, `The '${varChild.getText()}' child node is not supported by Ara Web, change the identifyVariableDeclaration()`, varChild);
                return Result.fail(err);
            }
        }
        return Result.fail(`Couldn't find the variable declaration`, `The identification of the variable failed`);
    };
}
