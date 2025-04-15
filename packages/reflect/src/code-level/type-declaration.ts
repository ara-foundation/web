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
    Expression
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

const referencedTypeLink = (typeRefNode: TypeReferenceNode): Result<AraLink<string>> => {
    const typeRefCount = typeRefNode.getChildCount();
    const typeRefIdentifier = typeRefNode.getChildAtIndex(0)
    if (!AstNode.isIdentifier(typeRefIdentifier)) {
        const err = Debug.error(
            `The property value type is a type reference, but the '${typeRefIdentifier.getText()}' doesn't support it`,
            `Ara Web supports Identifiers as type ref nodes, update referencedTypeLink() to support it`,
            typeRefIdentifier
        )
            
        return Result.fail(err)
    }

    const typeRefAraLink = ReflectAraLink.linkToIdentifier(typeRefIdentifier.getText());
    return Result.ok(typeRefAraLink);
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

    const propertySignatureChildren = AstNode.fromTsNode(propertySignature).getChildren(
        [], 
        [AstNode.isNonImportantNode, AstNode.isIdentifier], 
        [":", ",", "?"] // ? at the end of the property indicates it's optional.
    )
    const propertySignatureCount = propertySignatureChildren.length;

    for (let propertySignatureIndex = 0; propertySignatureIndex < propertySignatureCount; propertySignatureIndex++) {
        const propertySignatureChild = propertySignatureChildren[propertySignatureIndex].tsNode;

        // Expressions such as type keywords 'string', 'number', etc
        // Hold only one key
        if (AstNode.isExpression(propertySignatureChild)) {
            const identifedExpression = identifyExpression(propertySignatureIdentifier.getText(), propertySignatureChild as Expression);
            if (identifedExpression.isFailure) {
                return Result.fail(
                    `this.identifyExpression(identifier: '${propertySignatureIdentifier.getText()}', expression: '${propertySignatureChild.getText()}'): ${identifedExpression.errorTitle}`,
                    identifedExpression.errorDescription!
                )
            }
            typeDeclaration[propertySignatureIdentifier.getText()] = identifedExpression.getValue();
            return Result.ok(typeDeclaration);
        } else if (AstNode.isTypeRef(propertySignatureChild)) {
            const identifiedTypeRefLink = referencedTypeLink(propertySignatureChild as TypeReferenceNode)
            if (identifiedTypeRefLink.isFailure) {
                return Result.fail(
                    `this.referencedTypeLink(astNode: '${propertySignatureChild.getText()}'): ${identifiedTypeRefLink.errorTitle}`,
                    identifiedTypeRefLink.errorDescription!
                )
            }
            typeDeclaration[propertySignatureIdentifier.getText()] = identifiedTypeRefLink.getValue();
            return Result.ok(typeDeclaration);
        } else if (AstNode.isTypeLiteral(propertySignatureChild)) {
            Debug.push(`typeLiteralAstNodeToTypeDeclaration()`, {typeLiteral: propertySignatureChild.getText()})
            const identifiedTypeLiteral = typeLiteralAstNodeToTypeDeclaration(propertySignatureChild as TypeLiteralNode)
            Debug.pop()
            if (identifiedTypeLiteral.isFailure) {
                return Result.fail(
                    `this.typeLiteralAstNodeToTypeDeclaration(astNode: '${propertySignatureChild.getText()}'): ${identifiedTypeLiteral.errorTitle}`,
                    identifiedTypeLiteral.errorDescription!
                )
            }
            typeDeclaration[propertySignatureIdentifier.getText()] = identifiedTypeLiteral.getValue();
            return Result.ok(typeDeclaration);
        } else {
            const err = Debug.error(
                `The ${propertySignatureIndex}/${propertySignatureCount-1} child '${propertySignatureChild.getText()}' of TypeLiteral '${propertySignature.getText()}' is uncatched by Ara Web`,
                `Update the propertySignatureToTypeDeclaration()`,
                propertySignatureChild
            )
            Debug.log(`The node of '${propertySignatureChild.getText()}'`)
            Debug.log(propertySignatureChild)
            return Result.fail(err)
        }
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
    const typeLiteralSyntaxList = AstNode.fromTsNode(typeLiteral.getChildAtIndex(1) as SyntaxList).getChildren([], [AstNode.isNonImportantNode], [","]);
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
    const children = identifiedNode.getChildren([], [AstNode.isTypeKeyword], ["="]);
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
        } else if (!AstNode.isTypeLiteral(typeChild.tsNode)) {
            const err = Debug.error(
                `Unsupported type declaration's node, expected TypeLiteralNode for ${typeChild.tsNode.getText()}`,
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
