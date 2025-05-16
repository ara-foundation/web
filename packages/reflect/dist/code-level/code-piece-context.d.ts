import { Result } from "@ara-web/p-hintjens";
import { AraLink, ModuleLink } from "@ara-web/sds";
import type { MemoryOperations } from "../index.js";
import { CodePiece, type CodePieceRecord } from "./code-piece.js";
/**
 * Collection of the variables, functions that are available for the Ast Node.
 * Ast Nodes have three layers of the memories:
 * - Ast Node's own memory, for example if the node is generic and has to keep generic types.
 * - Module memory, where this ast node is called.
 * - Project memory including all the third party libraries, built-in NodeJS libraries.
 */
export declare class CodePieceContext {
    private _localDefined;
    private _pageIdentifiers;
    private _projectMemory;
    constructor(localDefined: CodePiece[], pageIdentifiers: CodePieceRecord, projectMemory: MemoryOperations);
    clone(additionalLocals: CodePiece[], skipIdentifiers?: string[]): CodePieceContext;
    /**
     * Returns the total amount of identifiers within the Ast Node's scope
     */
    get localScopeLength(): number;
    post(localDefined: CodePiece[]): void;
    private getLocal;
    private isLocal;
    private getPageIdentifier;
    getIdentifier: (data: AraLink<string> | string) => CodePiece | undefined;
    /**
     * Identify the Import Path of the given identifier
     * @param {string} identifier
     * @returns {string} the module path
     */
    identifyImportPath: (identifier: string) => Result<ModuleLink>;
}
