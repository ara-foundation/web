/**
 * Import Declarations
 */
import { Identifier, ImportClause, StringLiteral, type ImportDeclaration } from "ts-morph";
import { AstNodeType, type IdentifiedNode, type Identifiers, type ValueType } from "@scripts/reflect/codeLevel/types";
import { isNonImportantNode, isOneOfIdentifiers } from "@scripts/reflect/codeLevel/astNode";
import { Result } from "@scripts/result";
import { Debug } from "@scripts/debug";
import type { AraLink } from "@scripts/aralink/types";
import { araWebModuleLink } from "@scripts/aralink/rpc";
import { unquote } from "@scripts/string";

const identifyImportDefaultIdentifier = (astImport: ImportDeclaration): Result<string|undefined> => {
    for (let child of astImport.getChildren()) {
        if (isNonImportantNode(child) || isOneOfIdentifiers(child, ["import", "from"])) {
            continue;
        } else if (child instanceof StringLiteral) {
            continue;
        }
        
        if (child instanceof ImportClause) {
                for (let importClauseChild of child.getChildren()) {
                    if (importClauseChild instanceof Identifier) {
                        return Result.ok(importClauseChild.getText());
                    } else if (importClauseChild instanceof StringLiteral) {
                        continue;
                    }
                }
            } else if (child instanceof Identifier) {
                return Result.ok(child.getText())
            } else {
                Debug.log(
                    `The astimport '${astImport.getText()}' has a '${child.getText()}' child that is not import clause:`
                )
                Debug.log(child)
                return Result.fail(
                    `Unsupported child of import declaration`,
                    `The astimport '${astImport.getText()}' has a '${child.getText()}' child that is not import clause:`
                )
        }
    }

    return Result.ok(undefined);
}

const identifyImportLink = (astImport: ImportDeclaration): Result<AraLink> => {
    for (let child of astImport.getChildren()) {
        if (isNonImportantNode(child) || isOneOfIdentifiers(child, ["import", "from"])) {
            continue;
        } else if (child instanceof Identifier) {
            continue;
        }
        
        if (child instanceof ImportClause) {
                for (let importClauseChild of child.getChildren()) {
                    if (importClauseChild instanceof StringLiteral) {
                        return Result.ok(araWebModuleLink(unquote(importClauseChild.getText())));
                    } else if (importClauseChild instanceof Identifier) {
                        continue;
                    }
                }
            } else if (child instanceof StringLiteral) {
                return Result.ok(araWebModuleLink(unquote(child.getText())));
            } else {
                Debug.log(
                    `The astimport '${astImport.getText()}' has a '${child.getText()}' child that is not import clause:`
                )
                Debug.log(child)
                return Result.fail(
                    `Unsupported child of import declaration`,
                    `The astimport '${astImport.getText()}' has a '${child.getText()}' child that is not import clause:`
                )
            }
        }

    return Result.fail(
        `No import path found`,
        `The import declaration doesn't have the path in '${astImport.getText()}' import declaration`
    )
}

export const identifyNamedImports = (astImport: ImportDeclaration, importPath: AraLink): Result<Identifiers> => {
        let identifiers: Identifiers = {};
        // Maybe a component is actually defined outside, so its in the imports?
        const namedImports = astImport.getNamedImports();
        if (namedImports.length == 0) {
            return Result.ok(identifiers);
        }

        for (let i = 0; i < namedImports.length; i++) {
            const namedImport = namedImports[i];
            const namedImportAmount = namedImport.getChildCount();
            let identifier: string = "";
            let astType: AstNodeType = AstNodeType.Object;
            let value: ValueType = {};
            if (namedImportAmount === 1) {
                identifier = namedImport.getChildAtIndex(0).getText();
                astType = AstNodeType.Object;
                value = {};
            } else if (namedImportAmount === 2) {
                let prefix = namedImport.getChildAtIndex(0).getText();
                identifier = namedImport.getChildAtIndex(1).getText();
                if (prefix !== "type") {
                    Debug.log(`The import has '${prefix}' but supporting 'type' only`)
                } else {
                    astType = AstNodeType.Type;
                }
            } else if (namedImportAmount === 3) {
                identifier = namedImport.getLastChild()!.getText()!;
                astType = AstNodeType.Object;
                value = {};
            } else if (namedImportAmount > 4) {
                return Result.fail(
                    `named import ${i}/${namedImports.length-1} has more than 4 children`,
                    `Currently Ara Web does support imports with four children only. Change identifyImportPath()`
                )
            } else {
                let prefix = namedImport.getChildAtIndex(0).getText();
                if (prefix !== "type") {
                    Debug.log(`The import has '${prefix}' but supporting 'type' only`)
                } else {
                    astType = AstNodeType.Type;
                }
                identifier = namedImport.getLastChild()!.getText()!;
                value = {};
            }

            identifiers[identifier] = {
                nodeType: astType,
                data: value,
                importPath: importPath,
                identifier: identifier,
                public: false,
                constant: true,
            } as IdentifiedNode;
        }

        return Result.ok(identifiers);
    }

/**
 * Does the given ImportDeclaration holds the definition of the literal?
 * @param {ImportDeclaration} astImport the import module declaration
 * @returns {Identifiers}
*/
export const identifyImportDeclarations = (astImport: ImportDeclaration): Result<Identifiers> => {
        let identifiers: Identifiers = {};

        let importPath = identifyImportLink(astImport);
        if (importPath.isFailure) {
            return Result.fail(
                `this.identifyImportLink(astImport='${astImport.getText()}'): ${importPath.errorTitle}`,
                importPath.errorDescription!
            )
        }
        let importIdentifier = identifyImportDefaultIdentifier(astImport);
        if (importIdentifier.isFailure) {
            return Result.fail(
                `this.identifyImportDefaultIdentifier(astImport='${astImport.getText()}'): ${importIdentifier.errorTitle}`,
                importIdentifier.errorDescription!
            )
        }

        if (importPath.getValue().isEmpty()) {
            return Result.fail(
                `Can not identify the import module path`,
                `Failed to identify the import path by '${astImport.getText()}'`
            )
        } 

        if (importIdentifier.getValue() === undefined) {
            Debug.log(`The '${importPath.getValue()}' has no default identifier`)
        } else {
            identifiers[importIdentifier.getValue()!] = {
                nodeType: AstNodeType.Object,
                data: importPath.getValue().resource,
                importPath: importPath.getValue(),
                identifier: importIdentifier.getValue()!,
                public: false,
                constant: true,
            } as IdentifiedNode;
        }

    const namedImportIdentifiers = identifyNamedImports(astImport, importPath.getValue());
    if (namedImportIdentifiers.isFailure) {
            return Result.fail(
                `this.identifyNamedImports(astImport='${astImport.getText()}', importPath='${importPath.getValue()}')`,
                namedImportIdentifiers.errorDescription!
            )
    }
    identifiers = {...identifiers, ...namedImportIdentifiers.getValue()};

    const namespaceImport = astImport.getNamespaceImport();
    if (namespaceImport !== undefined) {
        Debug.log(`TODODODODODODO Namespace imports:`)
        Debug.log(JSON.stringify(namespaceImport))
    }

    const astAttr = astImport.getAttributes()
    if (astAttr !== undefined) {
        Debug.log(`TODODODODODODO Import attributes:`)
        Debug.log(JSON.stringify(astAttr))
    }

    return Result.ok(identifiers);
}