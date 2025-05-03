/**
 * Import Declarations in the code.
 *
 * Works with the ImportDeclaration from the ts-morph, that's why this module is inside the code-level.
 */
import { ImportSpecifier, NamedImports } from "ts-morph";
import { Result, Debug } from "@ara-web/p-hintjens";
import { AstNode, AstNodeType, TsNode, Identifier } from "../index.js";
export class NamedImport extends TsNode {
    _tsNode;
    constructor(tsNode) {
        super(tsNode);
        this._tsNode = tsNode.getNode();
    }
    static fromTsNode(tsNode) {
        if (!this.isNamedImport(tsNode)) {
            return Result.fail(`The given node is not named import`, `Please check the ts node`);
        }
        const namedImport = new NamedImport(tsNode);
        return Result.ok(namedImport);
    }
    static isNamedImport = (child) => {
        const node = child.getNode();
        return node instanceof NamedImports;
    };
    static isImportSpecifier = (child) => {
        const node = child.getNode();
        return node instanceof ImportSpecifier;
    };
    /**
     * Overwrites the TsNode's getChildren, by returning the children of syntax list node in named imports.
     * @returns
     */
    getChildren = () => {
        if (this._tsNode === undefined) {
            return [];
        }
        if (this._tsNode.getChildCount() != 3) {
            return [];
        }
        const syntaxList = new TsNode(this._tsNode.getChildAtIndex(1));
        if (!TsNode.isSyntaxList(syntaxList)) {
            return [];
        }
        return syntaxList.getChildren([], [TsNode.isNonImportant], [","]);
    };
    /**
     * Import declarations could be named such as:
     * import { name1, name2 } from "string-literal-path".
     *
     * This function identifies the Ast nodes for each named import identifiers.
     * @param astImport
     * @param importPath
     * @returns
     */
    static getIdentifiers = (nodeType, namedChildren) => {
        let identifiers = {};
        const namedImportChildCount = namedChildren.length;
        if (namedImportChildCount === 0) {
            return Result.ok(identifiers);
        }
        for (let i = 0; i < namedImportChildCount; i++) {
            if (NamedImport.isNamedImport(namedChildren[i])) {
                var namedImport = NamedImport.fromTsNode(namedChildren[i]);
                const namedIdentifiers = NamedImport.getIdentifiers(nodeType, namedImport.getValue().getChildren());
                if (namedIdentifiers.isFailure) {
                    return Result.fail(`NamedImport.getIdentifiers('${namedChildren[i].getText()}'): ${namedIdentifiers.errorTitle}`, namedIdentifiers.errorDescription);
                }
                identifiers = { ...identifiers, ...(namedIdentifiers.getValue()) };
            }
            else if (NamedImport.isImportSpecifier(namedChildren[i])) {
                const namedIdentifiers = NamedImport.getIdentifiers(nodeType, namedChildren[i].getChildren([], [TsNode.isNonImportant], [","]));
                if (namedIdentifiers.isFailure) {
                    return Result.fail(`NamedImport.getIdentifiers('${namedChildren[i].getText()}'): ${namedIdentifiers.errorTitle}`, namedIdentifiers.errorDescription);
                }
                identifiers = { ...identifiers, ...(namedIdentifiers.getValue()) };
            }
            else if (Identifier.isA(namedChildren[i])) {
                const identifier = namedChildren[i].getText();
                const identifiedNode = AstNode.fromTsNode(namedChildren[0]);
                identifiedNode.data = {};
                identifiedNode.constant = true;
                identifiedNode.public = false;
                const previous = namedChildren[i].getPreviousSibling();
                identifiedNode.nodeType = previous !== undefined && TsNode.isTypeKeyword(previous) ?
                    identifiedNode.nodeType = AstNodeType.Type :
                    identifiedNode.nodeType = nodeType;
                const next = namedChildren[i].getNextSibling();
                if (next !== undefined && TsNode.isAsKeyword(next)) {
                    const alias = next.getNextSibling();
                    if (alias === undefined) {
                        return Result.fail(`The import clause has 'as' keyword, but no next keyword`, `Please pass the correct AST Tree`);
                    }
                    if (!Identifier.isA(alias)) {
                        return Result.fail(`The alias '${alias.getText()}' of the type must be identifier`, `Ara Web doesn't support the node`);
                    }
                    const refNode = AstNode.fromTsNode(namedChildren[0]);
                    refNode.data = {};
                    refNode.constant = true;
                    refNode.public = false;
                    refNode.nodeType = identifiedNode.nodeType;
                    refNode.identifier = identifier;
                    identifiedNode.putMemoryData(refNode);
                    identifiedNode.identifier = alias.getText();
                    // In case of the alias, we identify the ast node as alias.
                    identifiers[alias.getText()] = identifiedNode;
                    i += 2;
                }
                else {
                    identifiedNode.identifier = identifier;
                    identifiers[identifier] = identifiedNode;
                }
            }
            else if (TsNode.isTypeKeyword(namedChildren[i])) {
                nodeType = AstNodeType.Type;
                continue;
            }
            else {
                const err = Debug.error(`NameImport.getIdentifiers() has received undefined named children`, `Please upgrade Ara Web to support '${namedChildren[i]}'`, namedChildren[i]);
                return Result.fail(err);
            }
        }
        return Result.ok(identifiers);
    };
}
