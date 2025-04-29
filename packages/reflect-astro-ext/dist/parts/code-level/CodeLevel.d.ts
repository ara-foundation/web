import { type AraPage } from "@ara-web/ts-enhancement/ontology";
import { Result } from "@ara-web/ts-enhancement/result";
import { ModuleMemory, ProjectMemory } from "@ara-web/reflect/memory";
/**
 * Reflect is the main source to Reflect on the website itself.
 */
export declare class CodeLevel {
    constructor();
    /**
     * Identifies all the types, variables that were defined in the source code.
     * @returns {Result<AraPage[]>}
     */
    static identifySourceCode: <T>(source: string | undefined, moduleMemory: ModuleMemory<T>, projectMemory: ProjectMemory) => Promise<Result<ModuleMemory<T>>>;
    /**
     * Returns a page by it's path
     */
    getPageByUrl: (url: string | undefined) => Promise<AraPage | undefined>;
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
