/**
 * The script that works with the code by turning it into the
 * AST (Abstract Syntax Tree)
 */
import { Project } from "ts-morph";
import { Result, ModuleLink } from "@ara-web/p-hintjens";
import { ModuleMemory, ProjectMemory } from "../index.js";
import { type AstIdentifiers } from "./ast-node.js";
import { type ValueType } from "./ast-node-data.js";
import { TsNode, type TsNodeValidator } from "./ts-node.js";
export type Object = {
    [key: string]: ValueType;
};
export declare class Code {
    private _ast;
    private _moduleLink;
    code: string;
    project: Project;
    tempCodeAmount: number;
    /********************************************************/
    /**
     * Convert the source code into the AST tree
     * @param source the typescript code
     */
    constructor(code: string, moduleLink: ModuleLink, tempCodeAmount?: number);
    /**
     * Gets from AST all child nodes.
     * AST's children at the root level are list of code pieces.
     * Instead parsing at the AST level, we check in the sub child level.
     * @param filters
     * @returns {TsNode[]}
     */
    getTsNodes: (filters?: TsNodeValidator[]) => TsNode[];
    /**
     * Parses the entire code for any import clauses. If any import clause,
     * then, using `./import-declarations.ts` will turn them into the import identifiers.
     *
     * This is the first function called by Reflect.
     * @returns AstIdentifiers
     */
    getImportedIdentifiers: (projectMemory: ProjectMemory) => Promise<Result<AstIdentifiers>>;
    /**
     * Creates a link that this import declaration imports from.
     * @returns {AraLink<string>} Link to the import
     */
    private importClauseToModuleLink;
    private setImportPaths;
    /**
     * Lint dependencies of the given module identified by type and path.
     *
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
    identifyCodePiece: <T>(_exp: string) => Promise<Result<T>>;
}
