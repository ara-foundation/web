/**
 * Import Declarations in the code.
 * 
 * Works with the ImportDeclaration from the ts-morph, that's why this module is inside the code-level.
 */
import { NamedImports } from "ts-morph";
import { Result, Debug } from "@ara-web/ts-enhancement";
import { AstNode, AstNodeType, type AstIdentifiers } from "../ast-node.js";
import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import { ReflectAraLink } from "../../araLink/ReflectAraLink.js";
import { TsNode, type TsNodeValidator } from "../ts-node.js";

export class NamedImport extends TsNode {
    protected _tsNode: NamedImports;

    private constructor (tsNode: TsNode) {
        super(tsNode);
        this._tsNode = tsNode.getNode<NamedImports>()!;
    }

    public static fromTsNode(tsNode: TsNode): Result<NamedImport> {
        if (!this.isNamedImport(tsNode)) {
            return Result.fail(
                `The given node is not named import`,
                `Please check the ts node`
            )
        }
        const namedImport = new NamedImport(tsNode);
        return Result.ok(namedImport)
    }

    public static isNamedImport: TsNodeValidator = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        return node instanceof NamedImports;
    }

    /**
     * Overwrites the TsNode's getChildren, by returning the children of syntax list node in named imports.
     * @returns 
     */
    public getChildren = (): TsNode[] => {
        if (this._tsNode === undefined) {
            return [];
        }

        if (this._tsNode.getChildCount() != 2) {
            return [];
        }

        const syntaxList = new TsNode(this._tsNode.getChildAtIndex(1))
        if (!TsNode.isSyntaxList(syntaxList)) {
            return [];
        }

        return syntaxList.getChildren([], [TsNode.isNonImportant], [","])
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
    public static getIdentifiers = (nodeType: AstNodeType, moduleLink: AraLink<string>, namedChildren: TsNode[]): Result<AstIdentifiers> => {
        let identifiers: AstIdentifiers = {};

            const namedImportChildCount = namedChildren.length;
            if (namedImportChildCount === 0) {
                return Result.ok(identifiers);
            }

            const identifiedNode = AstNode.fromTsNode(namedChildren[0]);
            identifiedNode.nodeType = nodeType;
            identifiedNode.data = {};
            identifiedNode.importPath = moduleLink;
            identifiedNode.constant = true;
            identifiedNode.public = false;
            identifiedNode.identifier = "";

            // Identifier
            if (namedImportChildCount === 1) {
                const identifier = namedChildren[0].getText();
                identifiedNode.identifier = identifier;
                identifiers[identifier] = identifiedNode;
                return Result.ok(identifiers)
            // Type, and Identifier
            } else if (namedImportChildCount === 2) {
                let prefix = namedChildren[0];
                if (!TsNode.isTypeKeyword(prefix)) {
                    return Result.fail(
                        `The import first element has '${prefix.getText()}' but supporting 'type' only`,
                        `Please update identifyNamedImports()`,
                    )
                } else {
                    identifiedNode.nodeType = AstNodeType.Type;
                }
                const identifier = namedChildren[1].getText();
                identifiedNode.identifier = identifier;
                identifiers[identifier] = identifiedNode;
                
                return Result.ok(identifiers);
            // Identifier, 'as' keyword and Alias
            } else if (namedImportChildCount === 3) {
                if (!TsNode.isAsKeyword(namedChildren[1])) {
                    return Result.fail(
                        `The three element's second element expected to be 'as' keyword`,
                        `The named import has three elements '${namedChildren[1].getText}', but second element is not 'as' keyword, update identifyNamedImports()`
                    )
                }
                
                const identifier = namedChildren[0].getText()!;
                identifiedNode.identifier = identifier;
                identifiers[identifier] = identifiedNode;
                
                const alias = namedChildren[2].getText()!;
                identifiers[alias] = ReflectAraLink.linkToIdentifier(identifier)
                return Result.ok(identifiers);
            // Type, Identifier, 'as' keyword and Alias
            } else if (namedImportChildCount === 4) {
                if (!TsNode.isTypeKeyword(namedChildren[0])) {
                    return Result.fail(`The import of type alias has '${namedChildren[0].getText()}' for expected 'type' keyword`, 'Please make sure the import clause is correct')
                } else {
                    identifiedNode.nodeType = AstNodeType.Type;
                }

                if (!TsNode.isAsKeyword(namedChildren[2])) {
                    return Result.fail(`The import at index 2 has '${namedChildren[2].getText()}' for expected 'as' keyword`, 'Please makre sure the import clause is correct')
                }

                const identifier = namedChildren[1].getText();
                const alias = namedChildren[3].getText()!;

                identifiedNode.identifier = identifier;
                identifiers[identifier] = identifiedNode;
                identifiers[alias] = ReflectAraLink.linkToIdentifier(identifier)
            } else {
                for (let i = 0; i < namedChildren.length; i++) {
                    Debug.log(`Named children ${i}) ${namedChildren[i].getText()}`);
                    Debug.log(namedChildren[i].getNode<Node>)
                }
                return Result.fail(
                    `Named import has more than 4 children`,
                    `Currently Ara Web does support imports with four children only. Change identifyNamedImports() to support a ${namedImportChildCount} nodes`
                )
            }

        return Result.ok(identifiers);
    }

}