import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import { AstNode, type AstIdentifiers } from "../code-level/ast-node.js";
import type { ProjectMemory } from "./ProjectMemory.js";
import { ReflectAraLink } from "../ara-link/ReflectAraLink.js";

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
    private _projectMemory: ProjectMemory;

    constructor(localDefined: AstNode[], pageIdentifiers: AstIdentifiers, projectMemory: ProjectMemory) {
        this._localDefined = localDefined;
        this._pageIdentifiers = pageIdentifiers;
        this._projectMemory = projectMemory;
    }

    public clone(localDefined: AstNode[]): AstNodeContext {
        const context = new AstNodeContext(this._localDefined, this._pageIdentifiers, this._projectMemory);
        context._localDefined = [...context._localDefined, ...localDefined]
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

        if (this._pageIdentifiers[identifier] instanceof AraLink) {
            return this.getIdentifier(this._pageIdentifiers[identifier] as AraLink<string>)
        } else if (this._pageIdentifiers[identifier] instanceof AstNode) {
            return this._pageIdentifiers[identifier] as AstNode;
        }
        return undefined;
    }

    public getIdentifier = (identifier: AraLink<string>): AstNode|undefined => {
        if (!ReflectAraLink.isIdentifierLink(identifier)) {
            return undefined;
        }

        let astNode: AstNode|undefined = undefined;

        if (this.isLocal(identifier.resource)) {
            astNode = this.getLocal(identifier.resource);
            if (astNode !== undefined) {
                return astNode;
            }
        }

        return this.getPageIdentifier(identifier.resource);
    }
}