/**
 * The script that works with the code by turning it into the
 * AST (Abstract Syntax Tree)
 */
import { Node, TypeAliasDeclaration, TypeParameterDeclaration, } from "ts-morph";
import { Result, Debug, StringTraits } from "@ara-web/p-hintjens";
import { ValueTypeString, CodePiece, CodePieceType, AstNodeTraits, Identifier, } from "../index.js";
import { TypeValueTraits } from "./type-value-traits.js";
export class TypeDeclaration {
    _tsNode;
    constructor(tsNode) {
        this._tsNode = tsNode;
    }
    static fromTsNode(tsNode) {
        if (!this.isTypeDeclaration(tsNode)) {
            return Result.fail(`this.isTypeDeclaration(): false`, `Please check the ts node '${tsNode.getText()}' is a valid node`);
        }
        const importDeclaration = new TypeDeclaration(tsNode);
        return Result.ok(importDeclaration);
    }
    getText() {
        return this._tsNode.getText();
    }
    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Type Declarations
    //
    /////////////////////////////////////////////////////////////////////////////////////////////
    static isTypeDeclaration = (child) => {
        return child instanceof TypeAliasDeclaration;
    };
    static isTypeParameterDeclaration = (child) => {
        return child instanceof TypeParameterDeclaration;
    };
    identifyGenericDeclaration = async (genericNode) => {
        const nodes = AstNodeTraits.getChildren(genericNode, [], [AstNodeTraits.isNonImportant], []);
        const paramCount = nodes.length;
        if (paramCount === 0) {
            return Result.fail(`The '${genericNode.getText()}' doesn't have any node`, `Please pass the correct type parameter declaration, or help to improve Medet's misclick`);
        }
        if (!Identifier.isA(nodes[0])) {
            const err = Debug.error(`The first node '${nodes[0].getText()}' is not identifier`, `Please update the Ara Web to support this feature or perhaps you made a mistake in your syntax? ;)`, nodes[0]);
            return Result.fail(err);
        }
        let identifiedNode = CodePiece.fromTsNode(genericNode);
        identifiedNode.constant = true;
        identifiedNode.nodeType = CodePieceType.Type;
        identifiedNode.identifier = nodes[0].getText();
        identifiedNode.data = {};
        identifiedNode.dataType = ValueTypeString.object;
        for (let paramCounter = 1; paramCounter < paramCount; paramCounter++) {
            const paramNode = nodes[paramCounter];
            if (!AstNodeTraits.isKeyword(paramNode, ["extends"])) {
                const err = Debug.error(`The second parameter of generic declaration is not 'extends'`, `Ara Web doesn't support the '${paramNode.getText()}' as the ${paramCounter + 1} node. Please update identifyGeneric()`, paramNode);
                return Result.fail(err);
            }
            // Check the data type
            paramCounter++;
            if (paramCounter >= paramCount) {
                return Result.fail(`Failed to identify the parameter.`, `The param after 'extends' expected, but not given`);
            }
            const nextParamNode = nodes[paramCounter];
            const nextParamValue = await TypeValueTraits.identifyTypeValue(nextParamNode);
            if (nextParamValue.isFailure) {
                return Result.fail(`identifyTypeValue(identifier: '${identifiedNode.identifier}', node: ${nextParamNode.getText()}): ${nextParamValue.errorTitle}`, nextParamValue.errorDescription);
            }
            identifiedNode.data = nextParamValue.getValue();
            continue;
        }
        return Result.ok(identifiedNode);
    };
    /**
     * Returns the Generic declaration defined as SyntaxList after the "<" opening
     * bracked that user sends
     * @param tsNode
     * @returns
     */
    static getGenericNodesAfterOpeningClause = (openingClause) => {
        const syntaxList = openingClause.getNextSibling();
        if (syntaxList === undefined || !AstNodeTraits.isSyntaxList(syntaxList)) {
            return [];
        }
        return AstNodeTraits.getChildren(syntaxList, [], [AstNodeTraits.isNonImportant], [","]);
    };
    /**
         *
         * @param node Is the given node is the opening the generic type declarations
         * @returns
     */
    static isGenericOpeningClause = (openingClause) => {
        if (openingClause.getText() !== "<") {
            return false;
        }
        const syntaxList = openingClause.getNextSibling();
        if (syntaxList === undefined || !AstNodeTraits.isSyntaxList(syntaxList)) {
            return false;
        }
        const closingClause = syntaxList.getNextSibling();
        if (closingClause === undefined || !AstNodeTraits.isKeyword(closingClause, ">")) {
            return false;
        }
        return true;
    };
    getAstNode = async () => {
        let identifiedNode = CodePiece.fromTsNode(this._tsNode);
        identifiedNode.constant = true;
        identifiedNode.nodeType = CodePieceType.Type;
        identifiedNode.data = undefined;
        let identifier = '';
        // Type declaration has 'type' keyword and '=' sign to skip.
        const children = AstNodeTraits.getChildren(this._tsNode, [], [AstNodeTraits.isTypeKeyword, AstNodeTraits.isNonImportant], ["="]);
        // Child = 0 is the keyword
        for (let i = 0; i < children.length; i++) {
            const typeChild = children[i];
            if (AstNodeTraits.isExportKeyword(typeChild)) {
                identifiedNode.public = true;
                continue;
            }
            else if (Identifier.isA(typeChild)) {
                identifier = StringTraits.unquote(typeChild.getText());
                identifiedNode.identifier = identifier;
                continue;
            }
            else if (TypeDeclaration.isGenericOpeningClause(typeChild)) {
                const typeAstNodes = TypeDeclaration.getGenericNodesAfterOpeningClause(typeChild);
                for (let typeAstNode of typeAstNodes) {
                    if (!(TypeDeclaration.isTypeParameterDeclaration(typeAstNode))) {
                        return Result.fail(`Type Parameter Declaration expected for generic types`, 'Please correct the syntax code');
                    }
                    const identifiedData = await this.identifyGenericDeclaration(typeAstNode);
                    if (identifiedData.isFailure) {
                        return Result.fail(`identifyGenericDeclaration(genericNode: '${typeAstNode.getText()}'): ${identifiedData.errorTitle}`, identifiedData.errorDescription);
                    }
                    identifiedNode.putMemoryData(identifiedData.getValue());
                }
                i += CodePiece.GenericNodeLength - 1;
                continue;
            }
            else {
                const identified = await TypeValueTraits.identifyTypeValue(typeChild);
                if (identified.isFailure) {
                    const err = Debug.error(`TypeValueTraits.identifyTypeValue(tsNode: '${typeChild.getText()}'): ${identified.errorTitle}`, identified.errorDescription, typeChild);
                    return Result.fail(err);
                }
                identifiedNode.data = identified.getValue();
            }
        }
        if (identifiedNode.identifier === undefined) {
            return Result.fail(`Couldn't find type's identfier`, `Please update typeDeclarationToAstIdentifier()`);
        }
        else if (identifiedNode.data === undefined) {
            return Result.fail(`Couldn't find type's data`, `Please update typeDeclarationToAstIdentifier()`);
        }
        return Result.ok(identifiedNode);
    };
}
