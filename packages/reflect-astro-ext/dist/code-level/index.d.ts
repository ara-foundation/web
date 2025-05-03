import { Result } from "@ara-web/p-hintjens";
import { ModuleMemory, ProjectMemory } from "@ara-web/reflect";
/**
 * Code analyzing
 */
export declare class CodeLevel {
    constructor();
    /**
     * Identifies all the types, variables that were defined in the source code.
     * @returns {Result<AraPage[]>}
     */
    static identifySourceCode: <T>(source: string | undefined, moduleMemory: ModuleMemory<T>, projectMemory: ProjectMemory) => Promise<Result<ModuleMemory<T>>>;
    private static identifyImports;
    private static lintTypes;
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
