/**
 * The script that works with the code by turning it into the 
 * AST (Abstract Syntax Tree)
 * @todo Make the components nested to each other
 * @todo fix the parsing of all pages
 * @todo somehow we need to show on PageModal the meta components
 */
import { ArrayTypeNode, Expression, IntersectionTypeNode, LiteralTypeNode, ParenthesizedTypeNode, TypeLiteralNode, UnionTypeNode } from "ts-morph";
import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import { Result, Debug } from "@ara-web/ts-enhancement";
import { TypeDeclaration, ValueTypeString, UnionTypeDeclaration, type IdentifiedNodeDataType, type ValueType, type LiteralType, IntersectedUnionType } from "../ast-node-data.js";
import { TsNode, type TsNodeValidator } from "../ts-node.js";
import { TypeRef } from "./type-ref.js";
import { ValueLevel } from "../value-level.js";

type PossibleTypeValue = 
    ValueTypeString | 
    AraLink<string> | 
    TypeDeclaration | 
    Array<IdentifiedNodeDataType> |
    LiteralType |
    UnionTypeDeclaration
;

/**
 * TypeValueTraits parses the type's parameters.
 * Supports TypeLiterals, TypeUnions and ArrayTypes.
 * 
 * TODO: Move the parts of linting here too.
 */
export class TypeValueTraits {
    public static readonly ERR_INVALID_INTERSECTION = `TypeValueTraits.Invalid_intersection`

    /**
     * Checks whether the data is literal such as a number, string or a boolean.
     * @param data to check
     * @returns 
     */
    public static isTypeDeclaration = (data?: PossibleTypeValue): boolean => {
        if (data === undefined || Array.isArray(data)) {
            return false;
        }
    
        return data instanceof IntersectedUnionType || data instanceof UnionTypeDeclaration ||
            data instanceof TypeDeclaration;
        // return ["object"].includes(typeof data)
    }

    public static isTypeLiteral: TsNodeValidator = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        return node instanceof TypeLiteralNode;
    }

    public static isArrayTypeDeclaration = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        return node instanceof ArrayTypeNode;
    }

    public static isUnionType = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        return node instanceof UnionTypeNode;
    }

    // The node is a literal value
    public static isLiteralType: TsNodeValidator = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        return node instanceof LiteralTypeNode;
    }

    public static isParenthesizedType: TsNodeValidator = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        return node instanceof ParenthesizedTypeNode;
    }

    public static isIntersectionType: TsNodeValidator = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        return node instanceof IntersectionTypeNode;
    }

    /**
     * ArrayType syntax that it parses with three children: 
     * - Identifier
     * - [
     * - ]
     * @param tsNode 
     * @returns {[IdentifiedNodeDataType] } either a link to 
     */
    public static identifyArrayType = (tsNode: TsNode): Result<Array<IdentifiedNodeDataType>> => {
        if (!TypeValueTraits.isArrayTypeDeclaration(tsNode)) {
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
        const arrayType = this.identifyTypeValue(tsNode.getChild(0)!)
        // Debug.pop()
        if (arrayType.isFailure) {
            return Result.fail(
                `identifyTypeValue(tsNode: '${tsNode.getText()}'): ${arrayType.errorTitle}`,
                arrayType.errorDescription!
            )
        }

        return Result.ok([arrayType.getValue()] as Array<IdentifiedNodeDataType>)
    }

    private static identifyExpression = (tsNode: TsNode): Result<ValueTypeString> => {
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
            return Result.ok(ValueTypeString.string);
        } else if (expValue === "number") {
            return Result.ok(ValueTypeString.number);
        } else if (expValue === "boolean") {
            return Result.ok(ValueTypeString.boolean);
        } else if (expValue === "object") {
            return Result.ok(ValueTypeString.object);
        } else {
            const err = Debug.error(
                `The '${expValue}' expression is not supported by Ara Web`,
                `update identifyExpression(memory)`,
                expression
            )
            return Result.fail(err)
        }
    }

    private static identifyLiteralType = (tsNode: TsNode): Result<LiteralType> => {
        if (!this.isLiteralType(tsNode)) {
            return Result.fail(
                `this.isLiteralType('${tsNode.getText()}'): false`,
                `The TS Node is not a literal type, please pass the correct data, or update this.isLiteralType() method`
            )
        }

        const children = tsNode.getChildren([], [TsNode.isNonImportant]);

        if (children.length !== 1) {
            return Result.fail(
                `tsNode.getChildren().length: to identify literal types the LiteralTypeNode must have one child`,
                `Please update identifyLiteralType() to support '${tsNode.getText()}' with '${children.length}' elements`
            )
        }

        const identifiedValue = ValueLevel.identifyLiteralValue(children[0]);
        if (identifiedValue.isFailure) {
            const err = Debug.error(
                `ValueLevel.identifyLiteralValue(tsNode: '${children[0].getText()}'): ${identifiedValue.errorTitle}`,
                identifiedValue.errorDescription!,
                children[0]            
            )

            return Result.fail(err);
        }
        
        return Result.ok(identifiedValue.getValue())
    }

    private static identifyParenthesizedType = (tsNode: TsNode): Result<PossibleTypeValue> => {
        if (!this.isParenthesizedType(tsNode)) {
            return Result.fail(
                `this.isParenthesizedType('${tsNode.getText()}'): false`,
                `The TS Node is not a parenthesized type, please pass the correct data, or update this.isParenthesizedType() method`
            )
        }

        const children = tsNode.getChildren([], [TsNode.isNonImportant], ["(", ")"]);

        if (children.length !== 1) {
            return Result.fail(
                `tsNode.getChildren().length: to identify parenthesized types the ParenthesizedTypeNode must have one child`,
                `Please update identifyParenthesizedType() to support '${tsNode.getText()}' with '${children.length}' elements`
            )
        }

        const identifiedValue = this.identifyTypeValue(children[0]);
        if (identifiedValue.isFailure) {
            const err = Debug.error(
                `this.identifyLiteralValue(tsNode: '${children[0].getText()}'): ${identifiedValue.errorTitle}`,
                identifiedValue.errorDescription!,
                children[0]            
            )

            return Result.fail(err);
        }
        
        return Result.ok(identifiedValue.getValue())
    }

    private static identifyIntersectionType = (tsNode: TsNode): Result<PossibleTypeValue> => {
        if (!this.isIntersectionType(tsNode)) {
            return Result.fail(
                `this.isIntersectionType('${tsNode.getText()}'): false`,
                `The TS Node is not a parenthesized type, please pass the correct data, or update this.isIntersectionType() method`
            )
        }

        let object: IntersectedUnionType = new IntersectedUnionType();

        const syntaxLists = tsNode.getChildren([TsNode.isSyntaxList]);
        if (syntaxLists.length !== 1) {
            return Result.fail(
                `tsNode.getChildren().length: to identify parenthesized types the ParenthesizedTypeNode must have one child`,
                `Please update identifyParenthesizedType() to support '${tsNode.getText()}' with '${syntaxLists.length}' elements`
            )
        }
        const children = syntaxLists[0].getChildren([], [TsNode.isNonImportant], ["&"])
        for (let intersectedIndex = 0; intersectedIndex < children.length; intersectedIndex++) {
            const intersectionChild = children[intersectedIndex];

            // Debug.push(`this.identifyTypeValue(tsNode: '${intersectionChild.getText()}')`)
            const identifiedValue = this.identifyTypeValue(intersectionChild);
            // Debug.pop();
            if (identifiedValue.isFailure) {
                const err = Debug.error(
                    `this.identifyLiteralValue(tsNode: '${intersectionChild.getText()}'): ${identifiedValue.errorTitle}`,
                    identifiedValue.errorDescription!,
                    intersectionChild            
                )

                return Result.fail(err);
            }
            
            if (!this.isTypeDeclaration(identifiedValue.getValue()) && !(identifiedValue.getValue() instanceof AraLink)) {
                return Result.fail(
                    `Intersect type ${intersectedIndex}/${children.length-1}: ${this.ERR_INVALID_INTERSECTION}`,
                    `Only objects such as literals or references could be as intersection, not '${identifiedValue.getValue()}'`
                )
            }

            // convert the type declaration to intersected union type.
            if (identifiedValue.getValue() instanceof UnionTypeDeclaration) {
                if (!(object instanceof IntersectedUnionType)) {
                    object = new IntersectedUnionType(object);
                }
            }

            /**
             * Object is our intersect.
             * Intersect could be a union or intersect.
             */
            if (object instanceof IntersectedUnionType) {
                if (identifiedValue.getValue() instanceof UnionTypeDeclaration) {
                    object.putOrPostUnion((identifiedValue.getValue() as UnionTypeDeclaration).union);
                } else if (identifiedValue.getValue() instanceof TypeDeclaration) {
                    object.putOrPost((identifiedValue.getValue() as TypeDeclaration).records);
                } else if (identifiedValue.getValue() instanceof AraLink) {
                    object.postAraLink(identifiedValue.getValue() as AraLink<string>);
                } else {
                    const err = Debug.error(
                        `Object is intersected union type. The returned data type is neither a union type declaration, nor type declaration`,
                        `Please update identifyIntersectionType() to support the data you provided`,
                        identifiedValue.getValue()
                    )

                    return Result.fail(err);
                }
            }
        }

        // Make sure that none of the types are not primitive types. But only a Reference or Object Literal
        return Result.ok(object)
    }

    public static identifyTypeValue = (tsNode: TsNode): Result<PossibleTypeValue> => {
        // Expressions such as type keywords 'string', 'number', etc
        // Hold only one key
        // returns ValueTypeString
        if (TsNode.isExpression(tsNode)) {
            const identifedExpression = this.identifyExpression(tsNode);
            if (identifedExpression.isFailure) {
                return Result.fail(
                    `this.identifyExpression(expression: '${tsNode.getText()}'): ${identifedExpression.errorTitle}`,
                    identifedExpression.errorDescription!
                )
            }
            return Result.ok(identifedExpression.getValue())
        // returns AraLink()
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
        // returns AstNode/TypeDeclaration
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
        // returns array with one IdentifiedNodeDataType element
        } else if (TypeValueTraits.isUnionType(tsNode)) {
            // Debug.push(`identifyTypeLiteral()`, {typeLiteral: tsNode.getText()})
            const identifiedTypeDeclaration = this.identifyUnionType(tsNode)
            // Debug.pop()
            if (identifiedTypeDeclaration.isFailure) {
                return Result.fail(
                    `this.identifyUnionType(tsNode: '${tsNode.getText()}'): ${identifiedTypeDeclaration.errorTitle}`,
                    identifiedTypeDeclaration.errorDescription!
                )
            }
            return Result.ok(identifiedTypeDeclaration.getValue());
        } else if (this.isArrayTypeDeclaration(tsNode)) {
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
        } else if (this.isLiteralType(tsNode)) {
            const identifiedLiteralType = this.identifyLiteralType(tsNode);
            if (identifiedLiteralType.isFailure) {
                return Result.fail(
                    `this.identifyLiteralType(): ${identifiedLiteralType.errorTitle}`,
                    identifiedLiteralType.errorDescription!
                )
            }

            return Result.ok(identifiedLiteralType.getValue())
        } else if (this.isParenthesizedType(tsNode)) {
            const identified = this.identifyParenthesizedType(tsNode);
            if (identified.isFailure) {
                return Result.fail(
                    `this.identifyParenthesizedType(): ${identified.errorTitle}`,
                    identified.errorDescription!
                )
            }

            return Result.ok(identified.getValue())
        } else if (this.isIntersectionType(tsNode)) {
            const identified = this.identifyIntersectionType(tsNode);
            if (identified.isFailure) {
                return Result.fail(
                    `this.identifyIntersectionType(): ${identified.errorTitle}`,
                    identified.errorDescription!
                )
            }

            return Result.ok(identified.getValue())
        } else {
            const err = Debug.error(
                `The '${tsNode.getText()}' TS Node as type value is uncatched by Ara Web`,
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

    // Type is defined as property and its value.
    // How come it returns type declaration? TypeDeclaration is from AstNode.
    private static identifyTypeLiteral = (tsNode: TsNode): Result<TypeDeclaration> => {
        if (!this.isTypeLiteral(tsNode)) {
            return Result.fail(
                `The node is not a type literal`,
                `Please pass the correct data to identifyTypeLiteral(), or update Ara Web to support '${tsNode.getText()}'`
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
        let typeDeclaration: TypeDeclaration = new TypeDeclaration();
        const typeLiteralSyntaxList =  syntaxList.getChildren([], [TsNode.isNonImportant], [","]);
        const typeLiteralNodesCount = typeLiteralSyntaxList.length;
                
            for (let typeLiteralIndex = 0; typeLiteralIndex < typeLiteralNodesCount; typeLiteralIndex++) {
                const typeLiteralNode = typeLiteralSyntaxList[typeLiteralIndex];
                if (!(TsNode.isPropertySignature(typeLiteralNode))) {
                    const err = Debug.error(
                        `The type literal node expects the property signature`,
                        `The '${typeLiteralNode.getText()}' is not a property signature, update the identifyTypeLiteral()`,
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
                if (!typeDeclaration.post(identifiedTypeProperty.getValue().records)) {
                    return Result.fail(
                        `typeDeclaration.post(): failed to post the data`,
                        `Please update the data to support posting the data`
                    )
                }
            }
                    
            return Result.ok(typeDeclaration);
    }

    private static identifyUnionType = (tsNode: TsNode): Result<UnionTypeDeclaration> => {
        if (!this.isUnionType(tsNode)) {
            const err = Debug.error(
                `this.isUnionType(tsNode: '${tsNode.getText()}'): Not valid`,
                `Please pass the correct data to identifyUnionType(), perhaps fix isUnionType(), or update Ara Web to support '${tsNode.getText()}'`,
                tsNode
            )
            return Result.fail(err)
        }
    
        const syntaxLists = tsNode.getChildren([TsNode.isSyntaxList]);
        if (syntaxLists.length !== 1) {
            return Result.fail(
                `Union type '${tsNode.getText()}' expected to have a syntax list child`,
                `Syntax list not found, please pass the correct union type`
            )
        }

        const children = syntaxLists[0].getChildren([], [TsNode.isNonImportant], ["|"]);
        
        // Working with the type literal
        let typeDeclaration: UnionTypeDeclaration = new UnionTypeDeclaration();
        for (let unionIndex = 0; unionIndex < children.length; unionIndex++) {
            const unionChild = children[unionIndex];
        
            // Debug.push(`propertySignatureToTypeDeclaration`, {PropertySignature: typeLiteralNode.getText()})
            const identifiedTypeValue = this.identifyTypeValue(unionChild);
            // Debug.pop();
            if (identifiedTypeValue.isFailure) {
                return Result.fail(
                    `union type ${unionIndex}/${children.length- 1}) this.identifyTypeValue(tsNode: '${unionChild.getText()}'): ${identifiedTypeValue.errorTitle}`,
                    identifiedTypeValue.errorDescription!
                )
            }

            typeDeclaration.postUnion(identifiedTypeValue.getValue())
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
    
        const typeDeclaration: TypeDeclaration = new TypeDeclaration();
        const propertySignatureIdentifier = tsNode.getChild(0)!
                
        if (!TsNode.isIdentifier(propertySignatureIdentifier)) {
            const err = Debug.error(
                `The '${tsNode.getText()}' first child expected to be an Identifier`,
                `Ara Web doesn't support the '${propertySignatureIdentifier.getText()}', update the propertySignatureToTypeDeclaration()`,
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
            const identifiedValue = this.identifyTypeValue(propertySignatureChild);
            // Debug.pop();
            
            if (identifiedValue.isFailure) {
                    return Result.fail(
                        `Property ${propertySignatureIndex}/${propertySignatureCount-1}): identifyTypeValue(astNode: '${propertySignatureChild.getText()}'): ${identifiedValue.errorTitle}`,
                        identifiedValue.errorDescription!
                    )
            }
            
            typeDeclaration.putOrPost({[propertyIdentifier]: identifiedValue.getValue()});
            return Result.ok(typeDeclaration);
        }
    
        return Result.fail(
            `The property signature doesn't have any expression after parsing ${propertySignatureCount} property signature nodes`,
            `Either pass a correct AST Node, or update propertySignatureToTypeDeclaration() to filter the children of ast node correctly`
        );
    }
    
}