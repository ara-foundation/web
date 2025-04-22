/**
 * Import Declarations in the code.
 * 
 * Works with the ImportDeclaration from the ts-morph, that's why this module is inside the code-level.
 */
import { ObjectBindingPattern, VariableDeclaration as TsVariableDeclaration } from "ts-morph";
import { Result, Debug } from "@ara-web/ts-enhancement";
import { TsNode, type TsNodeValidator } from "../ts-node.js";
import { AstNode, AstNodeType, type AstIdentifiers, type TypedData } from "../ast-node.js";
import { TypeValueTraits } from "../type-level/type-value-traits.js";
import { ReflectAraLink } from "../../ara-link/ReflectAraLink.js";
import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import { Identifier } from "../value-level/idenitifier.js";

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

    public static isObjectBindingPattern: TsNodeValidator = (child: TsNode): boolean => {
            const node = child.getNode<Node>();
            return node instanceof ObjectBindingPattern;
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
        const children = this.getChildren([Identifier.isA])
        if (children.length === 0) {
            return Result.fail(
                `The variable statement has no identifier`,
                `Please update the VariableStatement class to support '${this.getText()}' variable statement identifier fetching`
            )
        }

        return Result.ok(children[0].getText());
    }

    // Variable declaration comes as "var <declaration>" or "let <declaration>"
    /**
     * Parses this variable declaration into the list of AST Nodes.
     * @returns {AstIdentifiers}
     */
    public getAstIdentifiers = async (): Promise<Result<AstIdentifiers>> => {
        const identifiers: AstIdentifiers = {};
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

        const typedData = await this.getTypedData();
        if (typedData.isFailure) {
            return Result.fail(
                `this.getTypedData(): ${typedData.errorDescription}`,
                typedData.errorDescription!
            )
        }

        const identifier = this.getChild(0)!;
        if (!Identifier.isA(identifier)) {
            if (VariableDeclaration.isObjectBindingPattern(identifier)) {
                if (!(typedData.getValue().data instanceof AraLink)) {
                    return Result.fail(`When the variable declaration is an object binding pattern, it must have the assigned data`, `Please pass the variable assignment`)
                }
                if (!ReflectAraLink.isExpressionLink(typedData.getValue().data)) {
                    return Result.fail(`When the variable declaration is an object bidning, the the AraLink must be link to the expression`, `Please pass the variable assignment to the expression`)
                }
                const data = typedData.getValue().data as AraLink<string>;
                
                const syntaxLists = identifier.getChildren([TsNode.isSyntaxList]);
                if (syntaxLists.length !== 1) {
                    return Result.fail(`Identifier is object binding pattern, but no syntax list given`, 'Please pass correct TS Node');
                }

                const objectBindings = syntaxLists[0].getChildren([], [], [","]);
                for (let i = 0; i < objectBindings.length; i++) {
                    const binding = objectBindings[i].getChildren([Identifier.isA]);
                    if (binding.length < 1) {
                        const err = Debug.error(
                            `The first child of object binding pattern is not identifier`,
                            `Ara Web only supports identifiers. Update the getAstIdentifiers() to support '${objectBindings[i].getText()}'`,
                            binding
                        )
                        return Result.fail(err)
                    }

                    if (binding.length > 2) {
                        return Result.fail(
                            `The binding must have two identifiers at most`,
                            `Ara Web only supports binding with alias. Update the getAstIdentifiers() to support '${objectBindings[i].getText()}' with more than two identifiers`
                        )
                    }

                    const refNode: AstNode = AstNode.fromTsNode(binding[0]);
                    refNode.nodeType = AstNodeType.Property;
                    refNode.dataType = typedData.getValue().dataType;
                    refNode.data = data;
                    refNode.identifier = binding[0].getText();

                    let bindingNode = AstNode.fromTsNode(binding[0]);
                    bindingNode.identifier = binding[0].getText();
                    if (binding.length === 2) {
                        bindingNode = AstNode.fromTsNode(binding[1]);
                        bindingNode.identifier = binding[1].getText();
                    }
                    bindingNode.nodeType = AstNodeType.Variable;
                    bindingNode.public = this._publicFlag;
                    bindingNode.constant = this._constantFlag;
                    bindingNode.putMemoryData(refNode);
                    bindingNode.data = ReflectAraLink.linkToIdentifier(refNode.identifier!)

                    identifiers[bindingNode.identifier!] = bindingNode;
                }

                return Result.ok(identifiers);
            }
            const err = Debug.error(
                `The first child of variable declaration is not identifier`,
                `Ara Web only supports identifiers. Update the identifyVariableDeclarationList() to support '${identifier.getText()}'`,
                identifier
            )
            return Result.fail(err)
        } else {
            identifierNode.data = typedData.getValue().data;
            identifierNode.dataType = typedData.getValue().dataType;
        }
            
        if (identifier.getText().length === 0) {
            return Result.fail(
                `The variable identifier not defined`,
                `Probably the first child isn't an identifier`
            )
        } else {
            identifierNode.identifier = identifier.getText();
        }

        identifiers[identifierNode.identifier!] = identifierNode;
    
        return Result.ok(identifiers);
    }

    private getTypedData = async (): Promise<Result<TypedData>> => {
        const children = this.getChildren([], [TsNode.isNonImportant])
        children.shift(); // The first element is the identifier that we identified already
    
        const typedData: TypedData = {};

        for (let j = 0; j < children.length; j++) {
            let child = children[j];
            // Define the variable type
            if (TsNode.isKeyword(child, ":")) {
                j++;
                child = children[j];
                
                const dataType = await TypeValueTraits.identifyTypeValue(child);
                if (dataType.isFailure) {
                    const err = Debug.error(
                        `TypeValueTraits.identifyTypeValue('${child.getText()}'): ${dataType.errorTitle}`,
                        dataType.errorDescription!,
                        child
                    )
                    return Result.fail(err)
                }
                typedData.dataType = dataType.getValue();
            } else if (TsNode.isKeyword(child, "=")) {
                j++;
                child = children[j];
                const expressionRefAraLink = ReflectAraLink.linkToExpression(child);
                typedData.data = expressionRefAraLink;
            } else {
                const err = Debug.error(
                    `The child of variable declaration is unsupported by Ara Web`,
                    `The '${child.getText()}' is not supported by Ara Web, update identifyVariableDeclarationList()`,
                    child
                )
                return Result.fail(err)
            }
        }

        return Result.ok(typedData);
    }
}