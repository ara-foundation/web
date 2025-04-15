/**
 * Import Declarations in the code.
 * 
 * Works with the ImportDeclaration from the ts-morph, that's why this module is inside the code-level.
 */
import { ImportClause, NamedImports, SyntaxList, type ImportDeclaration } from "ts-morph";
import { Result, Debug, StringTraits } from "@ara-web/ts-enhancement";
import { AstNode, AstNodeType, type AstIdentifiers } from "./ast-node.js";
import { AraLink, PurlProtocol, AraWebModuleSlugs } from "@ara-web/ts-enhancement/ara-link";
import { ReflectAraLink } from "../araLink/ReflectAraLink.js";

/**
 * Creates a link that this import declaration imports from.
 * @param {astImport} astImport ast node from ts-morph package
 * @returns {AraLink<string>} Link to the import
 */
const getModuleLink = (astImport: ImportDeclaration): Result<AraLink<string>> => {
    const children = AstNode.fromTsNode(astImport).getChildren( 
        [],
        [AstNode.isIdentifier, AstNode.isNonImportantNode],
        ["import", "from"]
    )
    if (children.length === 0) {
        return Result.fail(
            "It can not be", 
            "ImportDeclaration doesn't have data, check astImport is correct, or update AstNode.getChildren()"
        )
    }
    
    for (let astNode of children) {
        if (astNode.tsNode instanceof ImportClause) {
            for (let importClauseChild of astNode.tsNode.getChildren()) {
                if (AstNode.isString(importClauseChild)) {
                    return Result.ok(new AraLink(PurlProtocol, StringTraits.unquote(importClauseChild.getText()), AraWebModuleSlugs));
                } 
            }
        } else if (AstNode.isString(astNode.tsNode)) {
            return Result.ok(new AraLink(PurlProtocol, StringTraits.unquote(astNode.tsNode.getText()), AraWebModuleSlugs));
        } else {
            const err = Debug.error(
                `Unsupported child of import declaration`,
                `The astimport '${astImport.getText()}' has a '${astNode.tsNode.getText()}' child that is not import clause`,
                astNode.tsNode,
            
            )
            return Result.fail(err)
        }
    }

    return Result.fail(
        `No import path found`,
        `The import declaration doesn't have the path in '${astImport.getText()}' import declaration`
    )
}

/**
 * Syntax to support:
 * import DefaultName from "string-literal-path".
 * @param astImport 
 * @returns 
 */
const identifyImportDefaultIdentifier = (astImport: ImportDeclaration): Result<string|undefined> => {
    const children = AstNode.fromTsNode(astImport).getChildren(
        [],
        [AstNode.isString, AstNode.isNonImportantNode],
        ["import", "from"]
    )
    if (children.length === 0) {
        return Result.fail(
            "It can not be", 
            "ImportDeclaration doesn't have data, check astImport is correct, or update AstNode.getChildren()"
        )
    }

    for (let astNode of children) {
        if (astNode.tsNode instanceof ImportClause) {
            for (let importClauseChild of astNode.tsNode.getChildren()) {
                if (AstNode.isIdentifier(importClauseChild)) {
                    return Result.ok(importClauseChild.getText());
                }
            }
        } else if (AstNode.isIdentifier(astNode.tsNode)) {
            return Result.ok(astNode.tsNode.getText())
        } else {
            const err = Debug.error(
                `Unsupported child of import declaration`,
                `The astimport '${astImport.getText()}' has a '${astNode.tsNode.getText()}' child that is not import clause`,
                astNode.tsNode,
            )
    
            return Result.fail(err)
        }
    }

    return Result.ok(undefined);
}

/**
 * Import declarations could be named such as:
 * import { name1, name2 } from "string-literal-path".
 * 
 * This function identifies the Ast nodes for each named import identifiers.
 * @param astImport 
 * @param importPath 
 * @returns 
 */
const identifyNamedImports = (astImport: ImportDeclaration, importPath: AraLink<string>): Result<AstIdentifiers> => {
    let identifiers: AstIdentifiers = {};
    // Maybe a component is actually defined outside, so its in the imports?
    const importClause = astImport.getImportClause();
    if (importClause === undefined) {
        return Result.fail(
            `Import Clause not found`,
            `The '${astImport.getText()}' doesn't have import clause`
        )
    }

    let nodeType = AstNodeType.Object;
    for (let child of importClause.getChildren()) {
        if (AstNode.isNonImportantNode(child)) {
            continue;
        } else if (AstNode.isTypeKeyword(child)) {
            nodeType = AstNodeType.Type
        } else if (child instanceof NamedImports) {
            const namedImports = ((child as NamedImports).getChildAtIndex(1) as SyntaxList).getChildren();

            for (let i = 0; i < namedImports.length; i++) {
                const namedImport = namedImports[i];
                const namedChildren = AstNode.fromTsNode(namedImport).getChildren([], [AstNode.isNonImportantNode], [','])
                const namedImportChildCount = namedChildren.length;
                if (namedImportChildCount === 0) {
                    continue;
                }

                const identifiedNode = AstNode.fromTsNode(namedImport);
                identifiedNode.nodeType = nodeType;
                identifiedNode.data = {};
                identifiedNode.importPath = importPath;
                identifiedNode.constant = true;
                identifiedNode.public = false;
                identifiedNode.identifier = "";

                // Identifier
                if (namedImportChildCount === 1) {
                    const identifier = namedImport.getChildAtIndex(0).getText();
                    identifiedNode.identifier = identifier;
                    identifiers[identifier] = identifiedNode;
                    continue;
                // Type, and Identifier
                } else if (namedImportChildCount === 2) {
                    let prefix = namedImport.getChildAtIndex(0);
                    if (!AstNode.isTypeKeyword(prefix)) {
                        return Result.fail(
                            `The import first element has '${prefix.getText()}' but supporting 'type' only`,
                            `Please update identifyNamedImports()`,
                        )
                    } else {
                        identifiedNode.nodeType = AstNodeType.Type;
                    }
                    const identifier = namedImport.getChildAtIndex(1).getText();
                    identifiedNode.identifier = identifier;
                    identifiers[identifier] = identifiedNode;
                    
                    continue;
                // Identifier, 'as' keyword and Alias
                } else if (namedImportChildCount === 3) {
                    if (!AstNode.isAsKeyword(namedImport.getChildAtIndex(1))) {
                        return Result.fail(
                            `The three element's second element expected to be 'as' keyword`,
                            `The named import has three elements '${namedImport.getText}', but second element is not 'as' keyword, update identifyNamedImports()`
                        )
                    }
                    
                    const identifier = namedImport.getChildAtIndex(0)!.getText()!;
                    identifiedNode.identifier = identifier;
                    identifiers[identifier] = identifiedNode;
                    
                    const alias = namedImport.getLastChild()!.getText()!;
                    identifiers[alias] = ReflectAraLink.linkToIdentifier(identifier)
                    continue;
                // Type, Identifier, 'as' keyword and Alias
                } else if (namedImportChildCount === 4) {
                    if (!AstNode.isTypeKeyword(namedImport.getChildAtIndex(0))) {
                        return Result.fail(`The import of type alias has '${namedImport.getChildAtIndex(2).getText()}' but supporting 'type' only`, 'Please make sure the import clause is correct')
                    } else {
                        identifiedNode.nodeType = AstNodeType.Type;
                    }

                    if (!AstNode.isAsKeyword(namedImport.getChildAtIndex(2))) {
                        return Result.fail(`The import at index 2 has '${namedImport.getChildAtIndex(2).getText()}' but supporting 'as' only`, 'Please makre sure the import clause is correct')
                    }

                    const identifier = namedImport.getChildAtIndex(1)!.getText();
                    const alias = namedImport.getLastChild()!.getText()!;

                    identifiedNode.identifier = identifier;
                    identifiers[identifier] = identifiedNode;
                    identifiers[alias] = ReflectAraLink.linkToIdentifier(identifier)
                } else {
                    for (let i = 0; i < namedChildren.length; i++) {
                        Debug.log(`Named children ${i}) ${namedChildren[i].tsNode.getText()}`);
                        Debug.log(namedChildren[i])
                    }
                    return Result.fail(
                        `Named import ${i}/${namedImports.length-1} has more than 4 children`,
                        `Currently Ara Web does support imports with four children only. Change identifyNamedImports() to support '${namedImport.getText()}' as a ${namedImportChildCount} nodes`
                    )
                }
            }
        }
    }

    return Result.ok(identifiers);
}

/**
 * Does the given ImportDeclaration holds the definition of the literal?
 * 
 * Import declarations could be default if it's a single literal.
 * 
 * import DefaultName from "string-literla-path"
 * @param {ImportDeclaration} astImport the import module declaration
 * @returns {AstIdentifiers}
*/
export const importDeclarationToAstIdentifiers = (astImport: ImportDeclaration): Result<AstIdentifiers> => {
    let identifiers: AstIdentifiers = {};

    let importPath = getModuleLink(astImport);
    if (importPath.isFailure) {
        return Result.fail(
            `this.identifyImportLink(astImport='${astImport.getText()}'): ${importPath.errorTitle}`,
            importPath.errorDescription!
        )
    } else if (importPath.getValue().isEmpty()) {
        return Result.fail(
            `Can not identify the import module path`,
            `Failed to identify the import path by '${astImport.getText()}'`
        )
    }

    let importIdentifier = identifyImportDefaultIdentifier(astImport);
    if (importIdentifier.isFailure) {
        return Result.fail(
            `this.identifyImportDefaultIdentifier(astImport='${astImport.getText()}'): ${importIdentifier.errorTitle}`,
            importIdentifier.errorDescription!
        )
    }

    // If the default identifier exist
    if (importIdentifier.getValue() !== undefined) {
        const astNode = AstNode.fromTsNode(astImport);
        astNode.nodeType = AstNodeType.Object;
        astNode.data = importPath.getValue();   // Entire glob
        astNode.importPath = importPath.getValue();
        astNode.identifier = importIdentifier.getValue()!;
        astNode.public = false,
        astNode.constant = true,
        identifiers[importIdentifier.getValue()!] = astNode;
    }

    const namedImportIdentifiers = identifyNamedImports(astImport, importPath.getValue());
    if (namedImportIdentifiers.isFailure) {
            return Result.fail(
                `this.identifyNamedImports(astImport='${astImport.getText()}', importPath='${importPath.getValue()}'): ${namedImportIdentifiers.errorTitle}`,
                namedImportIdentifiers.errorDescription!
            )
    }

    identifiers = {...identifiers, ...namedImportIdentifiers.getValue()};
    
    return Result.ok(identifiers);
}