import { Result } from "@ara-web/p-hintjens";
import { CodePiece, type CodePieceFilter } from "./code-level/index.js";
export declare class BuiltInIdentifiers {
    private static prefix;
    private static identifiers;
    private static builtInSrc;
    private static _identifiers;
    static isBuiltInIdentifier: CodePieceFilter;
    static isNonBuiltInIdentifier: CodePieceFilter;
    private static getVariableAstNode;
    static getBuiltInIdentifiers: () => Promise<Result<CodePiece[]>>;
    private static identifyArrayAstNode;
    private static identifyRecordAstNode;
    static getNodejsModuleByPath: (path: string) => Promise<CodePiece | undefined>;
}
