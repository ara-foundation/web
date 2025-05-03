import { Result } from "@ara-web/p-hintjens";
import { AstNode, type AstIdentifiers, type AstNodeValidator } from "./code-level/index.js";
export declare class BuiltInIdentifiers {
    private static prefix;
    private static identifiers;
    private static builtInSrc;
    private static _identifiers;
    static isBuiltInIdentifier: AstNodeValidator;
    static isNonBuiltInIdentifier: AstNodeValidator;
    private static getVariableAstNode;
    static getBuiltInIdentifiers: () => Promise<Result<AstIdentifiers>>;
    private static identifyArrayAstNode;
    private static identifyRecordAstNode;
    static getNodejsModuleByPath: (path: string) => Promise<AstNode | undefined>;
}
