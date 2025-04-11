/**
 * Work with the variable statements
 */

import { AstNodeType, type IdentifiedNode, type Identifiers } from "@scripts/reflect/codeLevel/types";
import { Result } from "@scripts/result";
import { ArrayTypeNode, Identifier, SyntaxList, TypeReferenceNode, VariableDeclaration, VariableDeclarationList, VariableStatement } from "ts-morph";
import type { Memory } from "@scripts/reflect/codeLevel/memory";
import { Debug } from "@scripts/debug";
import { isExportKeyword, isNonImportantNode, isOneOfIdentifiers } from "@scripts/reflect/codeLevel/astNode";
import { araIdentifierLink, araReflectExpressionLink } from "@scripts/aralink/rpc";

const identifyVariableDeclarationList = (varDeclarationList: VariableDeclarationList, identifierNode: IdentifiedNode, memory: Memory): Result<Identifiers> => {
    let identifiers: Identifiers = {};
    const childCount = varDeclarationList.getChildCount();

    for (let i = 0; i < varDeclarationList.getChildCount(); i++) {
        const varChild = varDeclarationList.getChildAtIndex(i);
        if (isNonImportantNode(varChild) || isOneOfIdentifiers(varChild, ["let", "var"])) {
            continue;
        } else if (varChild.getText() === "const") {
            identifierNode.constant = true;
            continue;
        } else if (!(varChild instanceof SyntaxList)) {
            const err = Debug.error(
                `Unsupported ${i}/${childCount-1} child`,
                `The variable declaration's ${i}/${childCount-1} child '${varChild.getText()}' is not supported by Ara Web, update identifyVariableDeclarationList()`,
                varChild,
            )
            return Result.fail(err);
        }

        const syntaxList = varChild as SyntaxList;
        if (syntaxList.getChildCount() === 0) {
            return Result.fail(
                `The syntax list of variable declaration list is empty`,
                `Probably one of the variable declaration statement's child nodes didn't have the 'continue', 'return' or 'break' and it passes to here. Update the identifyVariableDeclarationList()`
            )
        }
        
        const firstChild = syntaxList.getChildAtIndex(0)
        if (!(firstChild instanceof VariableDeclaration)) {
            const err = Debug.error(
                `The child of syntax list is not variable declaration`,
                `Only VariableDeclaration is expected`,
                firstChild,
            )
            return Result.fail(err)
        }

        const varDeclaration = firstChild as VariableDeclaration;
        const varDeclarationFirstChild = varDeclaration.getChildAtIndex(0);
        if (!(varDeclarationFirstChild instanceof Identifier)) {
            const err = Debug.error(
                `The first child of variable declaration is not identifier`,
                `Ara Web only supports identifiers. update the identifyVariableDeclarationList()`,
                firstChild
            )
            return Result.fail(err)
        }
            
        const identifier = varDeclarationFirstChild.getText();
        if (identifier === undefined || identifier.length === 0) {
            return Result.fail(
                `The variable identifier not defined`,
                `Probably the first child isn't an identifier`
            )
        } else {
            identifierNode.identifier = identifier;
        }

        for (let j = 1; j < varDeclaration.getChildCount(); j++) {
            let child = varDeclaration.getChildAtIndex(j);
            // Define the variable type
            if (isNonImportantNode(child)) {
                continue;
            } else if (isOneOfIdentifiers(child, ":")) {
                j++;
                child = varDeclaration.getChildAtIndex(j);
                if (!(child instanceof TypeReferenceNode) &&
                    !(child instanceof ArrayTypeNode)) {
                        const err = Debug.error(
                            `The child node '${child.getText()}' that comes after ':' is expected to be a TypeReferenceNode or ArrayTypeNode`,
                            `The unsupported data type by Ara Web, update the identifyVariableDeclarationList()`,
                            child
                        )
                        return Result.fail(err)
                }
                if (child instanceof ArrayTypeNode) {
                    Debug.log(`\n\n\n\nThe Array type's text is: '${child.getText()}' is Array<> or array[]?`)
                    if (child.getChildCount() !== 3) {
                        return Result.fail(
                            `The variable '${identifier}' type is not one dimension array`,
                            `Ara supports One Dimensional array, update identifyVariableDeclarationList()`
                        )
                    }
                    child = child.getChildAtIndex(0);
                    if (!(child instanceof TypeReferenceNode)) {
                        return Result.fail(
                            `The variable '${identifier}' type is a one dimensional array with non type reference`,
                            `Ara Web supports declared types referenced by the AST, update identifyVariableDeclarationList()`
                        )
                    }

                    const typeRefIdentifier = child.getChildAtIndex(0)
                    if (!(typeRefIdentifier instanceof Identifier)) {
                        return Result.fail(
                            `Unsupported type reference '${typeRefIdentifier.getText()}', update identifyVariableDeclarationList()`,
                            `Ara Web supports identifiers for now only`
                        )
                    }
                    const typeRefAraLink = araIdentifierLink(typeRefIdentifier.getText(), {'type': 'array'});
                    identifierNode.dataType = typeRefAraLink;
                } else {
                    const typeRefIdentifier = child.getChildAtIndex(0)
                    if (!(typeRefIdentifier instanceof Identifier)) {
                        return Result.fail(
                            `Unsupported type reference '${typeRefIdentifier.getText()}', update identifyVariableDeclarationList()`,
                            `Ara Web supports identifiers for now only`
                        )
                    }
                    const typeRefAraLink = araIdentifierLink(typeRefIdentifier.getText());
                    identifierNode.dataType = typeRefAraLink;
                }
            } else if (isOneOfIdentifiers(child, "=")) {
                j++;
                child = varDeclaration.getChildAtIndex(j);
                const expressionRefAraLink = araReflectExpressionLink(identifier, child);
                
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

        identifiers[identifier] = identifierNode
    }

    return Result.ok(identifiers);
}

/**
 * Get the variable declaration from the variable statement
 * @param varStatement 
 * @param memory 
 * @returns 
 */
export const defineVariableDeclaration = (varStatement: VariableStatement, memory: Memory): Result<Identifiers> => {
    let identifier: IdentifiedNode = {
        nodeType: AstNodeType.Variable,
        constant: false,
        public: false,
        data: {},
    }
    
    const childCount = varStatement.getChildCount();
    for (let i = 0; i < childCount; i++) {
        const varChild = varStatement.getChildAtIndex(i);
        if (isNonImportantNode(varChild)) {
            continue;
        } else if (isExportKeyword(varChild)) {
            identifier.public = true;
        } else if (varChild instanceof VariableDeclarationList) {
            // Debug.push(`identifyVariableDeclarationList()`, {'varDeclaration': varChild.getText(), 'identifierNode': JSON.stringify(identifier)})
            const identified = identifyVariableDeclarationList(varChild, identifier, memory);
            // Debug.pop();
            if (identified.isFailure) {
                return Result.fail(
                    `identifyVariableDeclarationList(varDeclaration='${varChild.getText()}', identifier='${JSON.stringify(identifier)}'): ${identified.errorTitle}`,
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
