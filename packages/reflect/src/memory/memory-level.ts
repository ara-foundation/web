import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import { AstNode, type AstIdentifiers } from "../code-level/ast-node.js";
import type { ProjectMemory } from "./ProjectMemory.js";
import { Debug } from "@ara-web/ts-enhancement";
import { ReflectAraLink } from "../araLink/ReflectAraLink.js";
import { TypeRef } from "../code-level/type-level/type-ref.js";

export class MemoryLevel {
    private static getLocal = (identifier: string, localDefined?: AstNode[]): AstNode|undefined => {
        if (localDefined === undefined) {
            return undefined;
        }
    
        for (let i = 0; i < localDefined.length; i++) {
            if (localDefined[i].identifier === identifier) {
                return localDefined[i];
            }
        }
    
        return undefined;
    }
    
    private static isLocal = (identifier: string, localDefined?: AstNode[]): boolean => {
        return this.getLocal(identifier, localDefined) !== undefined;
    }


    public static getIdentifier = (
        identifier: AraLink<string>,
        localDefined?: AstNode[], 
        pageIdentifiers?: AstIdentifiers, 
        projectMemory?: ProjectMemory
    ): AstNode|undefined => {
        if (!ReflectAraLink.isIdentifierLink(identifier)) {
            return undefined;
        }

        let astNode: AstNode|undefined = undefined;

        if (this.isLocal(identifier.resource, localDefined)) {
            astNode = this.getLocal(identifier.resource, localDefined);
            if (astNode === undefined) {
                return astNode;
            }
        }

        if (pageIdentifiers !== undefined && Object.keys(pageIdentifiers).indexOf(identifier.resource) > -1) {
            if (pageIdentifiers[identifier.resource] instanceof AraLink) {
                astNode = this.getIdentifier(pageIdentifiers[identifier.resource] as AraLink<string>, [], pageIdentifiers, projectMemory)
                if (astNode === undefined) {
                    return undefined;
                }
            } else if (pageIdentifiers[identifier.resource] instanceof AstNode) {
                astNode = pageIdentifiers[identifier.resource] as AstNode;
            }
        }

        return astNode;
    }
}