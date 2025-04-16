/**
 * The script that works with the code by turning it into the 
 * AST (Abstract Syntax Tree)
 * @todo Make the components nested to each other
 * @todo fix the parsing of all pages
 * @todo somehow we need to show on PageModal the meta components
 */
import { Expression, TypeLiteralNode } from "ts-morph";
import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import { Result, Debug } from "@ara-web/ts-enhancement";
import { ValueTypeString, type ValueType, type TypeDeclaration } from "../ast-node.js";
import { emptyValueByType } from "../value-level.js";
import { TsNode, type TsNodeValidator } from "../ts-node.js";
import { TypeRef } from "./type-ref.js";

/**
 * Type Values
 */
export class TypeValueTraits extends TsNode {
    public static isTypeLiteral: TsNodeValidator = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        return node instanceof TypeLiteralNode;
    }

    private static identifyArrayType = (tsNode: TsNode): Result<ValueType> => {
        if (TsNode.isArrayTypeDeclaration(tsNode)) {
            return Result.fail(
                `The variable '${tsNode.getText()}' type is expected to be Array Type Declaration.`,
                `Ara Web supports One Dimensional array type declaration only, update identifyArrayType()`
            )
        }

        if (!tsNode.isChildExist(2)) {
            return Result.fail(
                `The variable '${tsNode.getText()}' type is doesn't have 3 elements.`,
                `Ara supports One Dimensional array type declaration only, update identifyArrayType()`
            )
        }

        // Debug.push(`this.identifyTypeValue()`, {identifier: '_array_index', tsNode: tsNode.getText()});
        const arrayType = this.identifyTypeValue(`_array_index`, tsNode.getChild(0)!)
        // Debug.pop()
        if (arrayType.isFailure) {
            return Result.fail(
                `identifyTypeValue(identifier: '_array_index', exp: '${tsNode.getText()}'): ${arrayType.errorTitle}`,
                arrayType.errorDescription!
            )
        }

        if (arrayType.getValue() instanceof AraLink) {
            const typeRefLink = (arrayType.getValue() as AraLink<string>)
            return Result.ok(typeRefLink.copyWithProperties({'type': 'array'}))
        }
        
        return Result.ok([arrayType.getValue()] as Array<ValueType>)
    }

    private static identifyExpression = (identifier: string, tsNode: TsNode): Result<ValueType> => {
        if (!TsNode.isExpression(tsNode)) {
            return Result.fail(
                `identifyExpression requires Expression, but '${tsNode.getText()}' isn't`,
                `Update the identifyExpression()`
            )
        }
        const expression = tsNode.getNode<Expression>();
        const expCount = expression.getChildCount();
        if (expCount !== 0) {
            return Result.fail(
                `The Ara Web works with no child expression, your '${expression.getText()}' expression has '${expCount}' children`,
                `Update the identifyExpression()`
            )
        }
                
        const expValue = expression.getText();
        if (expValue === "string") {
            const value = emptyValueByType(identifier, ValueTypeString.string);
            if (value.isFailure) {
                return Result.fail(
                    `this.exactValueType<string>(identifier: '${identifier}', val: '${ValueTypeString.string}', t: ""); ${value.errorTitle}`,
                    value.errorDescription!
                )
            }
            return Result.ok(value.getValue());
        } else if (expValue === "number") {
            const value = emptyValueByType(identifier, ValueTypeString.number);
            if (value.isFailure) {
                return Result.fail(
                    `this.exactValueType<number>(identifier: '${identifier}', val: '${ValueTypeString.number}', t: 0); ${value.errorTitle}`,
                    value.errorDescription!
                )
            }
            return Result.ok(value.getValue())
        } else if (expValue === "boolean") {
            const value = emptyValueByType(identifier, ValueTypeString.boolean);
            if (value.isFailure) {
                return Result.fail(
                    `this.exactValueType<boolean>(identifier: '${identifier}', val: '${ValueTypeString.boolean}', t: false); ${value.errorTitle}`,
                    value.errorDescription!
                )
            }
            return Result.ok(value.getValue());
        } else if (expValue === "object") {
            const value = emptyValueByType(identifier, ValueTypeString.object);
            if (value.isFailure) {
                return Result.fail(
                    `this.exactValueType<object>(identifier: '${identifier}', val: '${ValueTypeString.boolean}', t: false); ${value.errorTitle}`,
                    value.errorDescription!
                )
            }
            return Result.ok(value.getValue());
        } else {
            const err = Debug.error(
                `The '${expValue}' expression is not supported by Ara Web`,
                `update identifyExpression(memory)`,
                expression
            )
            return Result.fail(err)
        }
    }

    public static identifyTypeValue = (identifier: string, tsNode: TsNode): Result<ValueType> => {
        // Expressions such as type keywords 'string', 'number', etc
        // Hold only one key
        if (TsNode.isExpression(tsNode)) {
            const identifedExpression = this.identifyExpression(identifier, tsNode);
            if (identifedExpression.isFailure) {
                return Result.fail(
                    `this.identifyExpression(identifier: '${identifier}', expression: '${tsNode.getText()}'): ${identifedExpression.errorTitle}`,
                    identifedExpression.errorDescription!
                )
            }
            return Result.ok(identifedExpression.getValue())
        } else if (TypeRef.isTypeRef(tsNode)) {
            const typeRef = TypeRef.fromTsNode(tsNode);
            if (typeRef.isFailure) {
                return Result.fail(
                    `TypeRef.fromTsNode(tsNode: '${tsNode.getText()}'): ${typeRef.errorTitle}`,
                    typeRef.errorDescription!
                )
            }
            const identifiedTypeRefLink = typeRef.getValue().getAraLink();
            if (identifiedTypeRefLink.isFailure) {
                return Result.fail(
                    `this.referencedTypeLink(astNode: '${tsNode.getText()}'): ${identifiedTypeRefLink.errorTitle}`,
                    identifiedTypeRefLink.errorDescription!
                )
            }
            return Result.ok(identifiedTypeRefLink.getValue());
        } else if (this.isTypeLiteral(tsNode)) {
            // Debug.push(`typeLiteralAstNodeToTypeDeclaration()`, {typeLiteral: node.getText()})
            const identifiedTypeLiteral = this.identifyTypeLiteral(tsNode)
            // Debug.pop()
            if (identifiedTypeLiteral.isFailure) {
                return Result.fail(
                    `this.identifyTypeLiteral(tsNode: '${tsNode.getText()}'): ${identifiedTypeLiteral.errorTitle}`,
                    identifiedTypeLiteral.errorDescription!
                )
            }
            return Result.ok(identifiedTypeLiteral.getValue());
        } else if (TsNode.isArrayTypeDeclaration(tsNode)) {
            // Debug.push(`identifyArrayType()`, {typeLiteral: node.getText()})
            const identifiedArrayValue = TypeValueTraits.identifyArrayType(tsNode);
            // Debug.pop()
            if (identifiedArrayValue.isFailure) {
                return Result.fail(
                    `this.identifyArrayType(astNode: '${tsNode.getText()}'): ${identifiedArrayValue.errorTitle}`,
                    identifiedArrayValue.errorDescription!
                )
            }
            return Result.ok(identifiedArrayValue.getValue());
        } else {
            const err = Debug.error(
                `The '${identifier}' property's '${tsNode.getText()}' expression is uncatched by Ara Web`,
                `Update the identifyTypeValue()`,
                tsNode
            )
            return Result.fail(err)
        }
    }

    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Generics
    //
    /////////////////////////////////////////////////////////////////////////////////////////////

    // For now it only supports object clause where
    // Type is defined as property and its value.
    public static identifyTypeLiteral = (tsNode: TsNode): Result<TypeDeclaration> => {
        if (!this.isTypeLiteral(tsNode)) {
            Debug.log(`The following type is not type literal`);
            Debug.log(tsNode);
            return Result.fail(
                `The node is not a type literal`,
                `Please pass the correct data to typeLiteralAstNodeToTypeDeclaration(), or update Ara Web to support '${tsNode.getText()}'`
            )
        }
    
        if (!tsNode.isChildExist(1)) {
            return Result.fail("The second element of type literal body is missing", `Please update Reflect to support '${tsNode.getText()}' expression as type data`)
        }
    
        const syntaxList = tsNode.getChild(1)!;
        if (!TsNode.isSyntaxList(syntaxList)) {
            return Result.fail("The second element of type literal body not a syntax list", `Please update Reflect to support '${tsNode.getText()}' expression as type data`)
        }
        
        // Working with the type literal
        let typeDeclaration: TypeDeclaration = {}
        const typeLiteralSyntaxList =  syntaxList.getChildren([], [TsNode.isNonImportant], [","]);
        const typeLiteralNodesCount = typeLiteralSyntaxList.length;
                
            for (let typeLiteralIndex = 0; typeLiteralIndex < typeLiteralNodesCount; typeLiteralIndex++) {
                const typeLiteralNode = typeLiteralSyntaxList[typeLiteralIndex];
                if (!(TsNode.isPropertySignature(typeLiteralNode))) {
                    const err = Debug.error(
                        `The type literal node expects the property signature`,
                        `The '${typeLiteralNode.getText()}' is not a property signature, update the typeLiteralAstNodeToTypeDeclaration()`,
                        typeLiteralNode
                    )
                    
                    return Result.fail(err)
                }
    
                // Debug.push(`propertySignatureToTypeDeclaration`, {PropertySignature: typeLiteralNode.getText()})
                const identifiedTypeProperty = this.propertySignatureToTypeDeclaration(typeLiteralNode);
                // Debug.pop();
                if (identifiedTypeProperty.isFailure) {
                    return Result.fail(
                        `propertySignatureToTypeDeclaration(propertySignature: '${typeLiteralNode.getText()}'): ${identifiedTypeProperty.errorTitle}`,
                        identifiedTypeProperty.errorDescription!
                    )
                }
                typeDeclaration = {...typeDeclaration, ...identifiedTypeProperty.getValue()}
            }
                    
            return Result.ok(typeDeclaration);
    }


    private static propertySignatureToTypeDeclaration = (tsNode: TsNode): Result<TypeDeclaration> => {
        if (!TsNode.isPropertySignature(tsNode)) {
            return Result.fail(
                `The node is not a property signature`,
                `Please pass the correct data to propertySignatureToTypeDeclaration(), or update Ara Web to support '${tsNode.getText()}'`
            )
        }
    
            if (!tsNode.isChildExist(0)) {
                return Result.fail(`The property signature is missing the first child`, `Please pass the valid data to property signature to type declaration`)
            }
    
            const typeDeclaration: TypeDeclaration = {}
            const propertySignatureIdentifier = tsNode.getChild(0)!
                
            if (!TsNode.isIdentifier(propertySignatureIdentifier)) {
                const err = Debug.error(
                    `The '${tsNode.getText()}' first child expected to be an Identifier`,
                    `Ara Web doesn't support the '${propertySignatureIdentifier.getText()}', update the typeLiteralAstNodeToTypeDeclaration()`,
                    propertySignatureIdentifier
                )
                return Result.fail(err)
            }
            const propertyIdentifier = propertySignatureIdentifier.getText();
    
            const propertySignatureChildren = tsNode.getChildren(
                [], 
                [TsNode.isNonImportant, TsNode.isIdentifier], 
                [":", ",", "?"] // ? at the end of the property indicates it's optional.
            )
            const propertySignatureCount = propertySignatureChildren.length;
    
            for (let propertySignatureIndex = 0; propertySignatureIndex < propertySignatureCount; propertySignatureIndex++) {
                const propertySignatureChild = propertySignatureChildren[propertySignatureIndex];
    
                // Debug.push(`identifyTypeValue()`, {identifier: propertyIdentifier, node: propertySignatureChild.getText()})
                const identifiedValue = TypeValueTraits.identifyTypeValue(propertyIdentifier, propertySignatureChild);
                // Debug.pop();
                if (identifiedValue.isFailure) {
                    return Result.fail(
                        `Property ${propertySignatureIndex}/${propertySignatureCount-1}) identifyTypeValue(identifier: '${propertyIdentifier}', astNode: '${propertySignatureChild.getText()}'): ${identifiedValue.errorTitle}`,
                        identifiedValue.errorDescription!
                    )
                }
                typeDeclaration[propertyIdentifier] = identifiedValue.getValue();
                return Result.ok(typeDeclaration);
            }
    
            return Result.fail(
                `The property signature doesn't have any expression after parsing ${propertySignatureCount} property signature nodes`,
                `Either pass a correct AST Node, or update propertySignatureToTypeDeclaration() to filter the children of ast node correctly`
            );
    }
    
}