import { Result } from "@ara-web/ts-enhancement";
import { AstNode, type AstIdentifiers, type AstNodeValidator } from "./code-level/ast-node.js";
export declare class EnabledNodejsModules {
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
