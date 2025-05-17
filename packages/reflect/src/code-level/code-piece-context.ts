import { Debug, Result } from "@ara-web/p-hintjens";
import { AraLink, ModuleLink } from "@ara-web/sds";
import type { MemoryOperations } from "../index.js";
import { CodePiece } from "./code-piece.js";

/**
 * Collection of the variables, functions that are available for the Ast Node.
 * Ast Nodes have three layers of the memories:
 * - Ast Node's own memory, for example if the node is generic and has to keep generic types.
 * - Module memory, where this ast node is called.
 * - Project memory including all the third party libraries, built-in NodeJS libraries.
 */
export class CodePieceContext {
    private _localDefined: CodePiece[];
    private _pageIdentifiers: CodePiece[]; 
    private _projectMemory: MemoryOperations;

    constructor(localDefined: CodePiece[], pageIdentifiers: CodePiece[], projectMemory: MemoryOperations) {
        this._localDefined = localDefined;
        this._pageIdentifiers = pageIdentifiers;
        this._projectMemory = projectMemory;
    }

    public clone(additionalLocals: CodePiece[], skipIdentifiers?: string[]): CodePieceContext {
        const context = new CodePieceContext(additionalLocals, [], this._projectMemory);
        if (skipIdentifiers === undefined) {
            context._pageIdentifiers = this._pageIdentifiers;
            context._localDefined = [...context._localDefined, ...this._localDefined];
        } else {
            for (let local of this._localDefined) {
                if (!skipIdentifiers.includes(local.identifier!)) {
                    context._localDefined.push(local);
                }
            }

            for (let identifier in this._pageIdentifiers) {
                if (!skipIdentifiers.includes(identifier)) {
                    context._pageIdentifiers[identifier] = this._pageIdentifiers[identifier];
                }
            }
        }
        return context;
    }

    /**
     * Returns the total amount of identifiers within the Ast Node's scope
     */
    public get localScopeLength(): number {
        if (this._localDefined === undefined) {
            return 0;
        }
        return this._localDefined.length;
    }

    public post(localDefined: CodePiece[]): void {
        this._localDefined = [...this._localDefined, ...localDefined];
    }

    private getLocal = (identifier: string): CodePiece|undefined => {
        if (this._localDefined === undefined || this._localDefined.length === 0) {
            return undefined;
        }
    
        for (let i = 0; i < this._localDefined.length; i++) {
            if (this._localDefined[i].identifier === identifier) {
                return this._localDefined[i];
            }
        }
    
        return undefined;
    }
    
    private isLocal = (identifier: string): boolean => {
        return this.getLocal(identifier) !== undefined;
    }

    private getPageIdentifier = (identifier: string): CodePiece|undefined => {
        if (this._pageIdentifiers === undefined || this._pageIdentifiers.find(codePiece => codePiece.identifier === identifier) === undefined) {
            return undefined;
        }
        const identifiedNode = this._pageIdentifiers.find((codePiece) => codePiece.identifier === identifier);
        if (identifiedNode === undefined) {
            return undefined;
        }

        return identifiedNode;
    }

    public getIdentifier = (data: AraLink<string>|string): CodePiece|undefined => {
        let identifier: string;
        if (typeof data !== "string") {
            identifier = data.resource;
        } else {
            identifier = data;
        }

        let astNode: CodePiece|undefined = undefined;

        if (this.isLocal(identifier)) {
            astNode = this.getLocal(identifier);
            if (astNode !== undefined) {
                return astNode;
            }
        }
        return this.getPageIdentifier(identifier);
    }

    /**
     * Identify the Import Path of the given identifier
     * @param {string} identifier
     * @returns {string} the module path
     */
    public identifyImportPath = (identifier: string): Result<ModuleLink> => {
        const astNode = this.getIdentifier(identifier);
        if (astNode === undefined) {
            return Result.fail(
                `this.getIdentifier('${identifier}'): not found`,
                `Ast Node for the identifier not found`
            )
        }

        if (astNode.importPath === undefined) {
            return Result.fail(
                `No import path found for the identifier`,
                `The identifier is not imported`
            )
        }

        return Result.ok(astNode.importPath)
    }
}