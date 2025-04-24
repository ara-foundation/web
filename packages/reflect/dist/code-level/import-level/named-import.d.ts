/**
 * Import Declarations in the code.
 *
 * Works with the ImportDeclaration from the ts-morph, that's why this module is inside the code-level.
 */
import { NamedImports } from "ts-morph";
import { Result } from "@ara-web/ts-enhancement";
import { AstNodeType, type AstIdentifiers } from "../ast-node.js";
import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import { TsNode, type TsNodeValidator } from "../ts-node.js";
export declare class NamedImport extends TsNode {
    protected _tsNode: NamedImports;
    private constructor();
    static fromTsNode(tsNode: TsNode): Result<NamedImport>;
    static isNamedImport: TsNodeValidator;
    static isImportSpecifier: TsNodeValidator;
    /**
     * Overwrites the TsNode's getChildren, by returning the children of syntax list node in named imports.
     * @returns
     */
    getChildren: () => TsNode[];
    /**
     * Import declarations could be named such as:
     * import { name1, name2 } from "string-literal-path".
     *
     * This function identifies the Ast nodes for each named import identifiers.
     * @param astImport
     * @param importPath
     * @returns
     */
    static getIdentifiers: (nodeType: AstNodeType, moduleLink: AraLink<string>, namedChildren: TsNode[]) => Result<AstIdentifiers>;
}
