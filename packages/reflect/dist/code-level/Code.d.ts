/**
 * The script that works with the code by turning it into the
 * AST (Abstract Syntax Tree)
 * @todo Make the components nested to each other
 * @todo fix the parsing of all pages
 * @todo somehow we need to show on PageModal the meta components
 */
import { Project } from "ts-morph";
import { Result } from "@ara-web/ts-enhancement";
import { type AstIdentifiers } from "./ast-node.js";
import { type ValueType } from "./ast-node-data.js";
import { ModuleMemory } from "../memory/ModuleMemory.js";
import type { ProjectMemory } from "../memory/ProjectMemory.js";
import { TsNode, type TsNodeValidator } from "./ts-node.js";
export type Object = {
    [key: string]: ValueType;
};
export declare class Code {
    private _ast;
    code: string;
    project: Project;
    tempCodeAmount: number;
    /********************************************************/
    /**
     * Convert the source code into the AST tree
     * @param source the typescript code
     */
    constructor(code: string, tempCodeAmount?: number);
    /**
     * Gets from AST all child nodes.
     * AST's children at the root level are list of code pieces.
     * Instead parsing at the AST level, we check in the sub child level.
     * @param filters
     * @returns {TsNode[]}
     */
    getTsNodes: (filters?: TsNodeValidator[]) => TsNode[];
    /**
     * Clone the Code with the new AST.
     * Used to evaluate various attributes by manipulating AST itself.
     * @returns {Code}
     */
    private clone;
    /**
     * Parses the entire code for any import clauses. If any import clause,
     * then, using `./import-declarations.ts` will turn them into the import identifiers.
     *
     * This is the first function called by Reflect.
     * @returns AstIdentifiers
     */
    getImportedIdentifiers: () => Result<AstIdentifiers>;
    /**
     * Lint dependencies of the given module identified by type and path.
     *
     * Fetches the import identifiers, and passes them into the lintImportedIdentifiers().
     * @param moduleMemory
     * @param projectMemory {Lint from all modules}
     * @returns
     */
    getLintedImportIdentifiers: <T>(moduleMemory: ModuleMemory<T>, projectMemory: ProjectMemory) => Promise<Result<AstIdentifiers>>;
    /**
     * If the node type is a Type, then it simply sets the {} empty object and leaves as it is.
     *
     * Otherwise, for all others, it will get the glob data and put it on the import.
     * @param identifiedNode
     * @requires identifiedNode.identifier
     * @requires idenfifiedNode.importPath
     * @limitation Make sure identifiedNode passes the AstNode.isDefinedInOtherModule() before calling this function.
     * @returns
     */
    private identifyImportedIdentifier;
    getLintedTypeIdentifiers: <T>(memory: ModuleMemory<T>, projectMemory: ProjectMemory) => Promise<Result<AstIdentifiers>>;
    /**
     * Returns all the types defined in this code.
     * @param memory
     * @returns
     */
    getTypeIdentifiers: () => Promise<Result<AstIdentifiers>>;
    getVariableIdentifiers: () => Promise<Result<AstIdentifiers>>;
    /**
     * Find the result of the expression, by setting it as a variable declaration.
     * @param {string} exp a JS doc that after evaluating gives the result
     * @returns {T} the result of the expression
     */
    identifyCodePiece: <T>(exp: string) => Promise<Result<T>>;
    /**
     * Get the variable declaration AST tree for the variable
     * @param identifier The variable's name
     * @returns {Result<VariableDeclaration>}
     */
    private identifyVariableDeclaration;
}
