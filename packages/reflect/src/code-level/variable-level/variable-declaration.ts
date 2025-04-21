/**
 * Import Declarations in the code.
 * 
 * Works with the ImportDeclaration from the ts-morph, that's why this module is inside the code-level.
 */
import { VariableDeclaration as TsVariableDeclaration } from "ts-morph";
import { Result, Debug } from "@ara-web/ts-enhancement";
import { TsNode, type TsNodeValidator } from "../ts-node.js";
import { AstNode, AstNodeType } from "../ast-node.js";
import { TypeValueTraits } from "../type-level/type-value-traits.js";
import { ReflectAraLink } from "../../araLink/ReflectAraLink.js";

export class VariableDeclaration extends TsNode {
    protected _tsNode: TsVariableDeclaration;
    private _publicFlag: boolean;
    private _constantFlag: boolean;

    private constructor (tsNode: TsNode, flags: {public: boolean, constant: boolean}) {
        super(tsNode);
        this._tsNode = tsNode.getNode<TsVariableDeclaration>()!;
        this._constantFlag = flags.constant;
        this._publicFlag = flags.public;
    }

    public static fromTsNode(tsNode: TsNode, flags: {public: boolean, constant: boolean}): Result<VariableDeclaration> {
        if (!this.isVariableDeclaration(tsNode)) {
            return Result.fail(
                `The given node is not a variable declaration`,
                `Please check the ts node`
            )
        }

        const varStatement = new VariableDeclaration(tsNode, flags);
        return Result.ok(varStatement)
    }

    public static isVariableDeclaration: TsNodeValidator = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        return node instanceof TsVariableDeclaration;
    }

    /**
     * Returns the variable's identifier
     */
    public getIdentifier = (): Result<string> => {
        const rawChildren = this.getChildren([], [TsNode.isNonImportant, TsNode.isConstKeyword]);
        for (let rawChild of rawChildren) {
            Debug.log(`The raw child of var statement '${rawChild.getText()}':`);
            Debug.log(rawChild)
        }
        const children = this.getChildren([TsNode.isIdentifier])
        if (children.length === 0) {
            return Result.fail(
                `The variable statement has no identifier`,
                `Please update the VariableStatement class to support '${this.getText()}' variable statement identifier fetching`
            )
        }

        return Result.ok(children[0].getText());
    }

    // Variable declaration comes as "var <declaration>" or "let <declaration>"
    public getAstNode = (): Result<AstNode> => {
        const identifierNode = AstNode.fromTsNode(this._tsNode as unknown as TsNode);
        identifierNode.nodeType = AstNodeType.Variable;
        identifierNode.public = this._publicFlag;
        identifierNode.constant = this._constantFlag;
        
        if (!this.isChildExist(0)) {
            return Result.fail(
                `The '${this.getText()}' is empty`,
                `Please update to have the data in the variable statement`
            )
        }
    
        const identifier = this.getChild(0)!;
        if (!TsNode.isIdentifier(identifier)) {
            const err = Debug.error(
                `The first child of variable declaration is not identifier`,
                `Ara Web only supports identifiers. Update the identifyVariableDeclarationList() to support '${identifier.getText()}'`,
                identifier
            )
            return Result.fail(err)
        }
            
        if (identifier.getText().length === 0) {
            return Result.fail(
                `The variable identifier not defined`,
                `Probably the first child isn't an identifier`
            )
        } else {
            identifierNode.identifier = identifier.getText();
        }

        const children = this.getChildren([], [TsNode.isNonImportant])
        children.shift(); // The first element is the identifier that we identified already
    
        for (let j = 0; j < children.length; j++) {
            let child = children[j];
            // Define the variable type
            if (TsNode.isKeyword(child, ":")) {
                j++;
                child = children[j];
                
                const dataType = TypeValueTraits.identifyTypeValue(identifier.getText(), child);
                if (dataType.isFailure) {
                    const err = Debug.error(
                        `TypeValueTraits.identifyTypeValue(identifier: '${identifier.getText()}', tsNode: '${child.getText()}'): ${dataType.errorTitle}`,
                        dataType.errorDescription!,
                        child
                    )
                    return Result.fail(err)
                }
                identifierNode.dataType = dataType.getValue();
            } else if (TsNode.isKeyword(child, "=")) {
                j++;
                child = children[j];
                const expressionRefAraLink = ReflectAraLink.linkToExpression(identifier.getText(), child);
                identifierNode.data = expressionRefAraLink;
            } else {
                const err = Debug.error(
                    `The child of variable declaration is unsupported by Ara Web`,
                    `The '${child.getText()}' is not supported by Ara Web, update identifyVariableDeclarationList()`,
                    child
                )
                return Result.fail(err)
            }
        } 
    
        return Result.ok(identifierNode);
    }
}