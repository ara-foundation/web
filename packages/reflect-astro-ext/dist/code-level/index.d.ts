import { Result } from "@ara-web/p-hintjens";
import { ModuleMemory, ProjectMemory } from "@ara-web/reflect";
import type { Meta } from "../index.js";
import type { ValueType } from "@ara-web/reflect/code-level";
/**
 * Code analyzing
 */
export declare class CodeLevel {
    constructor();
    static identifyMeta: (source: string | undefined) => Meta;
    /**
     * Identifies all the types, variables that were defined in the source code.
     * @returns {Result<AraPage[]>}
     */
    static identifySourceCode: <T>(source: string | undefined, moduleMemory: ModuleMemory<T>, projectMemory: ProjectMemory) => Promise<Result<ModuleMemory<T>>>;
    static identifyCodePiece(expression: string, moduleMemory: ModuleMemory<unknown>, projectMemory: ProjectMemory): Promise<Result<ValueType>>;
    private static identifyImports;
    private static lintTypes;
    private static lintVariables;
    private static lintImports;
    /**
     * Parses all the source code, and finds custom types defined by this module
     * @param contentModuleType
     * @param contents
     * @param pageMemories
     * @param projectMemory
     * @returns
     */
    private static identifyTypes;
}
