import { Result } from "@ara-web/p-hintjens";
import { type AstIdentifiers, type AstNodeValidator } from "@ara-web/reflect/code-level";
/**
 * Adds the global variables available in Astro framework, such
 * as `Astro` variable.
 */
export declare class AstroBuiltInIdentifiers {
    private static prefix;
    private static identifiers;
    private static builtInSrc;
    private static _identifiers;
    static isBuiltInIdentifier: AstNodeValidator;
    static isNonBuiltInIdentifier: AstNodeValidator;
    private static getVariableAstNode;
    static getBuiltInIdentifiers: () => Promise<Result<AstIdentifiers>>;
    private static identifyAstroAstNode;
}
