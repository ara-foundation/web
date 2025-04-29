import { Result, AraLink, ModuleLink } from "@ara-web/ts-enhancement";
import type { MemoryOperations } from "../index.js";
import { AstNode, type AstIdentifiers } from "./ast-node.js";

/**
 * Collection of the variables, functions that are available for the Ast Node.
 * Ast Nodes have three layers of the memories:
 * - Ast Node's own memory, for example if the node is generic and has to keep generic types.
 * - Module memory, where this ast node is called.
 * - Project memory including all the third party libraries, built-in NodeJS libraries.
 */
export class AstNodeContext {
    private _localDefined: AstNode[];
    private _pageIdentifiers: AstIdentifiers; 
    private _projectMemory: MemoryOperations;

    constructor(localDefined: AstNode[], pageIdentifiers: AstIdentifiers, projectMemory: MemoryOperations) {
        this._localDefined = localDefined;
        this._pageIdentifiers = pageIdentifiers;
        this._projectMemory = projectMemory;
    }

    public clone(additionalLocals: AstNode[], skipIdentifiers?: string[]): AstNodeContext {
        const context = new AstNodeContext(additionalLocals, {}, this._projectMemory);
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

    public post(localDefined: AstNode[]): void {
        this._localDefined = [...this._localDefined, ...localDefined];
    }

    private getLocal = (identifier: string): AstNode|undefined => {
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

    private getPageIdentifier = (identifier: string): AstNode|undefined => {
        if (this._pageIdentifiers === undefined || Object.keys(this._pageIdentifiers).indexOf(identifier) === -1) {
            return undefined;
        }

        const identified = this._pageIdentifiers[identifier];

        if (identified instanceof AraLink) {
            return this.getIdentifier(identified)
        } else if (identified instanceof AstNode) {
            return identified;
        }
        return undefined;
    }

    public getIdentifier = (data: AraLink<string>|string): AstNode|undefined => {
        let identifier: string;
        if (typeof data !== "string") {
            identifier = data.resource;
        } else {
            identifier = data;
        }

        let astNode: AstNode|undefined = undefined;

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