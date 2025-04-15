/**
 * The script that works with the code by turning it into the 
 * AST (Abstract Syntax Tree)
 * @todo Make the components nested to each other
 * @todo fix the parsing of all pages
 * @todo somehow we need to show on PageModal the meta components
 */
import { 
    CallExpression,
    Identifier, ImportClause, JSDoc, Project, SourceFile as TsSourceFile, StringLiteral, TypeReferenceNode, 
    VariableDeclarationKind,
    SyntaxList,
    ImportDeclaration,
    ExpressionStatement,
    BinaryExpression,
    ObjectLiteralExpression,
    SpreadAssignment,
    PropertyAssignment,
    VariableDeclaration,
    ArrayLiteralExpression,
    PropertyAccessExpression,
    EnumMember,
    NumericLiteral,
    ShorthandPropertyAssignment,
    CommentStatement,
    VariableStatement,
    ParenthesizedExpression,
    ConditionalExpression,
    PrefixUnaryExpression,
    Node,
    TypeAliasDeclaration,
    TypeLiteralNode,
    PropertySignature,
    Expression,
    ArrayTypeNode,
    TypeParameterDeclaration
} from "ts-morph";
import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import { StringTraits, Result, Debug } from "@ara-web/ts-enhancement";
import { callFuncInModule } from "../fileLevel.js";
import { importDeclarationToAstIdentifiers } from "./import-declaration.js";
import { defineVariableDeclaration } from "./variable.js";
import { ValueTypeString, type ValueType, type IdentifiedNodeDataType, AstNode, type AstIdentifiers, AstNodeType, type TypeDeclaration } from "./ast-node.js";
import { deepCopy } from "@ara-web/ts-enhancement";
import { ReflectAraLink } from "../araLink/ReflectAraLink.js";
import { ModuleMemory } from "../memory/ModuleMemory.js";
import type { ModuleType } from "../module.js";
import type { Memory } from "../memory/Memory.js";
import { emptyValueByType } from "./value-level.js";

/////////////////////////////////////////////////////////////////////////////////////////////
//
// Type Declarations
//
/////////////////////////////////////////////////////////////////////////////////////////////

const identifyArrayType = (arrayNode: ArrayTypeNode): Result<ValueType> => {
    if (arrayNode.getChildCount() !== 3) {
        return Result.fail(
            `The variable '${arrayNode.getText()}' type is doesn't have 4 elements.`,
            `Ara supports One Dimensional array type declaration only, update identifyArrayType()`
        )
    }

    const arrayType = identifyTypeValue(`_array_index`, arrayNode.getChildAtIndex(0))
    if (arrayType.isFailure) {
        return Result.fail(
            `identifyTypeValue(identifier: '_array_index', exp: '${arrayNode.getText()}'): ${arrayType.errorTitle}`,
            arrayType.errorDescription!
        )
    }

    if (arrayType.getValue() instanceof AraLink) {
        const typeRefLink = (arrayType.getValue() as AraLink<string>)
        return Result.ok(typeRefLink.copyWithProperties({'type': 'array'}))
    }
    
    return Result.ok([arrayType.getValue()] as Array<ValueType>)
}

const identifyExpression = (identifier: string, expression: Expression): Result<ValueType> => {
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

const isGenericRefType = (typeRefNode: TypeReferenceNode): boolean => {
    const children = AstNode.fromTsNode(typeRefNode).getChildrenByTsNode([], [AstNode.isNonImportantNode]);
    if (children.length !== 4) {
        return false;
    }
    return (children[1].tsNode.getText() === "<" && children[3].tsNode.getText() === ">");
}

const genericRefValueNodes = (typeRefNode: TypeReferenceNode): AstNode[] => {
    return AstNode.fromTsNode(typeRefNode.getChildAtIndex(2)).getChildrenByTsNode([], [AstNode.isNonImportantNode], [","]);
}

const identifyGenericRefValue = (typeNode: AraLink<string>, typeRefNode: TypeReferenceNode): Result<AraLink<string>> => {
    const nodes = genericRefValueNodes(typeRefNode);
    const nodeValues: ValueType[] = [];
    for (let nodeIndex in nodes) {
        const node = nodes[nodeIndex]
        const nodeValue = identifyTypeValue(`generic_${typeRefNode.getText()}_${nodeIndex}`, node.tsNode)
        if (nodeValue.isFailure) {
            return Result.fail(
                `Generic key ${nodeIndex}) this.identifyTypeValue(expression: '${typeRefNode.getText()}'): ${nodeValue.errorTitle}`,
                nodeValue.errorDescription!
            )
        }
        nodeValues.push(nodeValue.getValue())
    }

    return Result.ok(typeNode.copyWithProperties({'generic_values': nodeValues}))
}

const referencedTypeLink = (typeRefNode: TypeReferenceNode): Result<AraLink<string>> => {
    const typeRefIdentifier = typeRefNode.getChildAtIndex(0)
    Debug.log(`Referenced type link '${typeRefNode.getText()}' has ${typeRefNode.getChildCount()} nodes`);
    if (!AstNode.isIdentifier(typeRefIdentifier)) {
        const err = Debug.error(
            `The property value type is a type reference, but the '${typeRefIdentifier.getText()}' doesn't support it`,
            `Ara Web supports Identifiers as type ref nodes, update referencedTypeLink() to support it`,
            typeRefIdentifier
        )
            
        return Result.fail(err)
    }

    const typeRefAraLink = ReflectAraLink.linkToIdentifier(typeRefIdentifier.getText());

    if (isGenericRefType(typeRefNode)) {
        const identifiedGenericValue = identifyGenericRefValue(typeRefAraLink, typeRefNode);
        if (identifiedGenericValue.isFailure) {
            return Result.fail(
                `this.identifyExpression(expression: '${typeRefNode.getText()}'): ${identifiedGenericValue.errorTitle}`,
                identifiedGenericValue.errorDescription!
            )
        } 
        return Result.ok(identifiedGenericValue.getValue())
    }
    return Result.ok(typeRefAraLink);
}

const identifyGenericDeclaration = (genericNode: TypeParameterDeclaration): Result<AstNode> => {
    const nodes = AstNode.fromTsNode(genericNode).getChildrenByTsNode([], [AstNode.isNonImportantNode], []);
    const paramCount = nodes.length;
    if (paramCount === 0) {
        return Result.fail(
            `The '${genericNode.getText()}' doesn't have any node`,
            `Please pass the correct type parameter declaration, or help to improve Medet's misclick`
        )
    }

    if (!AstNode.isIdentifier(nodes[0].tsNode)) {
        const err = Debug.error(
            `The first node '${nodes[0].tsNode.getText()}' is not identifier`,
            `Please update the Ara Web to support this feature or perhaps you made a mistake in your syntax? ;)`,
            nodes[0].tsNode
        );

        return Result.fail(err)
    }

    let identifiedNode = AstNode.fromTsNode(genericNode);
    identifiedNode.constant = true;
    identifiedNode.nodeType = AstNodeType.Type;
    identifiedNode.identifier = nodes[0].tsNode.getText();
    identifiedNode.data = {};
    identifiedNode.dataType = ValueTypeString.object;

    for (let paramCounter = 1; paramCounter < paramCount; paramCounter++) {
        const paramNode = nodes[paramCounter];
        if (!AstNode.isKeyword(paramNode.tsNode, ["extends"])) {
            const err = Debug.error(
                `The second parameter of generic declaration is not 'extends'`,
                `Ara Web doesn't support the '${paramNode.tsNode.getText()}' as the ${paramCounter+1} node. Please update identifyGeneric()`,
                paramNode
            )
            return Result.fail(err);
        }
        // Check the data type
        paramCounter++;
        if (paramCounter >= paramCount) {
            return Result.fail(`Failed to identify the parameter.`, `The param after 'extends' expected, but not given`)
        }
        const nextParamNode = nodes[paramCounter];
        const nextParamValue = identifyTypeValue(identifiedNode.identifier, nextParamNode.tsNode);
        if (nextParamValue.isFailure) {
            return Result.fail(
                `identifyTypeValue(identifier: '${identifiedNode.identifier}', node: ${nextParamNode.tsNode.getText()}): ${nextParamValue.errorTitle}`,
                nextParamValue.errorDescription!
            )
        }
        identifiedNode.data = nextParamValue.getValue();
        continue;
    }

    return Result.ok(identifiedNode)
}

const identifyTypeValue = (identifier: string, node: Node): Result<ValueType> => {
    // Expressions such as type keywords 'string', 'number', etc
    // Hold only one key
    if (AstNode.isExpression(node)) {
        const identifedExpression = identifyExpression(identifier, node as Expression);
        if (identifedExpression.isFailure) {
            return Result.fail(
                `this.identifyExpression(identifier: '${identifier}', expression: '${node.getText()}'): ${identifedExpression.errorTitle}`,
                identifedExpression.errorDescription!
            )
        }
        return Result.ok(identifedExpression.getValue())
    } else if (AstNode.isTypeRef(node)) {
        const identifiedTypeRefLink = referencedTypeLink(node as TypeReferenceNode)
        if (identifiedTypeRefLink.isFailure) {
            return Result.fail(
                `this.referencedTypeLink(astNode: '${node.getText()}'): ${identifiedTypeRefLink.errorTitle}`,
                identifiedTypeRefLink.errorDescription!
            )
        }
        return Result.ok(identifiedTypeRefLink.getValue());
    } else if (AstNode.isTypeLiteral(node)) {
        Debug.push(`typeLiteralAstNodeToTypeDeclaration()`, {typeLiteral: node.getText()})
        const identifiedTypeLiteral = typeLiteralAstNodeToTypeDeclaration(node as TypeLiteralNode)
        Debug.pop()
        if (identifiedTypeLiteral.isFailure) {
            return Result.fail(
                `this.typeLiteralAstNodeToTypeDeclaration(astNode: '${node.getText()}'): ${identifiedTypeLiteral.errorTitle}`,
                identifiedTypeLiteral.errorDescription!
            )
        }
        return Result.ok(identifiedTypeLiteral.getValue());
    } else if (AstNode.isArrayTypeDeclaration(node)) {
        Debug.push(`identifyArrayType()`, {typeLiteral: node.getText()})
        const identifiedArrayValue = identifyArrayType(node as ArrayTypeNode);
        Debug.pop()
        if (identifiedArrayValue.isFailure) {
            return Result.fail(
                `this.identifyArrayType(astNode: '${node.getText()}'): ${identifiedArrayValue.errorTitle}`,
                identifiedArrayValue.errorDescription!
            )
        }
        return Result.ok(identifiedArrayValue.getValue());
    } else {
        const err = Debug.error(
            `The '${identifier}' property's '${node.getText()}' expression is uncatched by Ara Web`,
            `Update the identifyTypeValue()`,
            node
        )
        return Result.fail(err)
    }
}

const propertySignatureToTypeDeclaration = (propertySignature: PropertySignature): Result<TypeDeclaration> => {
    const typeDeclaration: TypeDeclaration = {}
    let propertySignatureIdentifier = propertySignature.getChildAtIndex(0);
        
    if (!AstNode.isIdentifier(propertySignatureIdentifier)) {
        const err = Debug.error(
            `The '${propertySignature.getText()}' first child expected to be an Identifier`,
            `Ara Web doesn't support the '${propertySignatureIdentifier.getText()}', update the typeLiteralAstNodeToTypeDeclaration()`,
            propertySignatureIdentifier
        )
        return Result.fail(err)
    }
    const propertyIdentifier = propertySignatureIdentifier.getText();

    const propertySignatureChildren = AstNode.fromTsNode(propertySignature).getChildrenByTsNode(
        [], 
        [AstNode.isNonImportantNode, AstNode.isIdentifier], 
        [":", ",", "?"] // ? at the end of the property indicates it's optional.
    )
    const propertySignatureCount = propertySignatureChildren.length;

    for (let propertySignatureIndex = 0; propertySignatureIndex < propertySignatureCount; propertySignatureIndex++) {
        const propertySignatureChild = propertySignatureChildren[propertySignatureIndex].tsNode;

        Debug.push(`identifyTypeValue()`, {identifier: propertyIdentifier, node: propertySignatureChild.getText()})
        const identifiedValue = identifyTypeValue(propertyIdentifier, propertySignatureChild);
        Debug.pop();
        Debug.log(`Property '${propertyIdentifier}' value identified:`);
        Debug.log(identifiedValue)
        Debug.log(`Property '${propertyIdentifier}' value against:`);
        Debug.log(propertySignatureChild)
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

// For now it only supports object clause where
// Type is defined as property and its value.
const typeLiteralAstNodeToTypeDeclaration = (typeLiteral: TypeLiteralNode): Result<TypeDeclaration> => {
    // Working with the type literal
    let typeDeclaration: TypeDeclaration = {}
    const typeLiteralSyntaxList = AstNode.fromTsNode(typeLiteral.getChildAtIndex(1) as SyntaxList).getChildrenByTsNode([], [AstNode.isNonImportantNode], [","]);
    const typeLiteralNodesCount = typeLiteralSyntaxList.length;
        
    for (let typeLiteralIndex = 0; typeLiteralIndex < typeLiteralNodesCount; typeLiteralIndex++) {
        const typeLiteralNode = typeLiteralSyntaxList[typeLiteralIndex].tsNode;
        if (!(typeLiteralNode instanceof PropertySignature)) {
            const err = Debug.error(
                `The type literal node expects the property signature`,
                `The '${typeLiteralNode.getText()}' is not a property signature, update the typeLiteralAstNodeToTypeDeclaration()`,
                typeLiteralNode
            )
            
            return Result.fail(err)
        }

        Debug.push(`propertySignatureToTypeDeclaration`, {PropertySignature: typeLiteralNode.getText()})
        const identifiedTypeProperty = propertySignatureToTypeDeclaration(typeLiteralNode);
        Debug.pop();
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

export const typeDeclarationToAstIdentifier = (typeDeclaration: TypeAliasDeclaration): Result<AstNode> => {
    let identifiedNode = AstNode.fromTsNode(typeDeclaration);
    identifiedNode.constant = true;
    identifiedNode.nodeType = AstNodeType.Type;
    identifiedNode.data = undefined;
        
    let identifier: string = '';

    // Type declaration has 'type' keyword and '=' sign to skip.
    const children = identifiedNode.getChildrenByTsNode([], [AstNode.isTypeKeyword], ["="]);
    // Child = 0 is the keyword
    for (let i = 0; i < children.length; i++) {
        const typeChild = children[i];
        if (AstNode.isExportKeyword(typeChild.tsNode)) {
            identifiedNode.public = true;
            continue;
        } else if (AstNode.isIdentifier(typeChild.tsNode)) {
            identifier = StringTraits.unquote(typeChild.tsNode.getText());
            identifiedNode.identifier = identifier;
            continue;
        } else if (AstNode.isGenericLiteral(typeChild.tsNode)) {
            const typeAstNodes = AstNode.getGenericLiteralOpenedSyntaxList(typeChild.tsNode);
            Debug.log(`The '${typeChild.tsNode.getText()}' is generic type declaration beginning, with: ${typeAstNodes.length} amount of generic types`);
            for (let typeAstNode of typeAstNodes) {
                Debug.log(`Generic type declaration '${typeAstNode.tsNode.getText()}':`);
                if (!(typeAstNode.tsNode instanceof TypeParameterDeclaration)) {
                    return Result.fail(`Type Parameter expected for generic types`, 'Please correct the syntax code')
                }
                const identifiedData = identifyGenericDeclaration(typeAstNode.tsNode as TypeParameterDeclaration);
                if (identifiedData.isFailure) {
                    return Result.fail(`identifyGenericDeclaration(genericNode: '${typeAstNode.tsNode.getText()}'): ${identifiedData}`, identifiedData.errorDescription!)
                }
                identifiedNode.putMemoryData(identifiedData.getValue());
            }
            i += AstNode.GenericNodeLength - 1;
            continue;
        }
        else if (!AstNode.isTypeLiteral(typeChild.tsNode)) {
            const err = Debug.error(
                `Unsupported type declaration's node, expected TypeLiteralNode for '${typeChild.tsNode.getText()}' expression`,
                `Update the typeDeclarationToAstIdentifiers() function`,
                typeChild.tsNode
            )
            return Result.fail(err)
        }

        Debug.push(`typeLiteralAstNodeToTypeDeclaration()`, {typeLiteral: typeChild.tsNode.getText()})
        const identifiedTypeDeclaration = typeLiteralAstNodeToTypeDeclaration(typeChild.tsNode as TypeLiteralNode)
        Debug.pop()
        if (identifiedTypeDeclaration.isFailure) {
            return Result.fail(
                `typeLiteralAstNodeToTypeDeclaration(typeLiteral: '${typeChild.tsNode.getText()}'): ${identifiedTypeDeclaration.errorTitle}`,
                identifiedTypeDeclaration.errorDescription!
            )
        }
        identifiedNode.data = identifiedTypeDeclaration.getValue();
    }

    if (identifiedNode.identifier === undefined) {
        return Result.fail(`Couldn't find type's identfier`, `Please update typeDeclarationToAstIdentifier()`)
    } else if (identifiedNode.data === undefined) {
        return Result.fail(`Couldn't find type's data`, `Please update typeDeclarationToAstIdentifier()`)
    }

    return Result.ok(identifiedNode);
}
