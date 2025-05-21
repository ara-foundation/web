import { ModuleLink, Rest, type ModuleURL } from "@ara-web/sds";
import { OkResult, Result } from "@ara-web/p-hintjens";
import { ModuleMemory, type AutoImporter, type ImportedRecords, type ExtensionInterface, type SingleRecord, type ReflectElementType } from "./index.js";
/**
 * Adds the support of the NodeJS built in context such Array, Record generics.
 */
export declare class ReflectExtension implements ExtensionInterface {
    reflectExtension: boolean;
    private _moduleLink;
    /**
     * Link such as pkg:npm/lodash -> pkg:npm/lodash?absolutePath=file:///...
     */
    private _moduleMemories;
    protected _untrackedModules: ModuleURL[];
    protected _autoImporter?: AutoImporter;
    constructor(moduleLink?: ModuleLink);
    getModuleWithFileExtensions(_: ModuleLink): ModuleLink[];
    get untrackedModuleAmount(): number;
    get memoryOperatorId(): ModuleLink;
    get packageLink(): ModuleLink;
    get moduleLink(): ModuleLink;
    get moduleMemories(): ModuleMemory<unknown>[];
    get moduleCategories(): string[];
    isSupportedModuleCategory(moduleCategory: string): boolean;
    putPackage({ importModuleClause, module, moduleCategory }: SingleRecord & {
        moduleCategory: string;
    }): Promise<Result<ModuleLink>>;
    putModules(params: (ImportedRecords | SingleRecord) & {
        moduleCategory: string;
    }): Promise<Result<ModuleLink[]>>;
    watchModules: (autoImporter: AutoImporter) => void;
    protected _autoPut: (moduleCategory: string) => Promise<Result<ModuleLink[]>>;
    getModule<T>(moduleLink: ModuleLink | string): Result<ModuleMemory<T>>;
    getModules<T>(moduleCategory?: string): ModuleMemory<T>[];
    isModuleExist(moduleLink: ModuleLink | ModuleURL): boolean;
    getModuleContents<T>(moduleCategory?: string): T[];
    getNoContentModules<T>(moduleCategory?: string): ModuleMemory<T>[];
    afterCreation(): OkResult;
    protected _trackModules: (rest: Rest<ReflectElementType>) => OkResult;
}
