import { type AutoImporter, type ExtensionInterface, type ImportedRecords, ModuleMemory, ProjectMemory, type SingleRecord } from "@ara-web/reflect";
import { ModuleLink, type ModuleURL, SDSService, type SDSExtensionInterface, type SDSSetup, Rest } from "@ara-web/sds";
import { OkResult, Result } from "@ara-web/p-hintjens";
import type { ReflectElementType } from "@ara-web/reflect";
import { type Page } from "./ontology/index.js";
export interface AstroExtensionInterface extends SDSExtensionInterface {
    afterPageLvlIdenfication?(moduleCategory: string, module: ModuleMemory<Page>, projectMemory: ProjectMemory): Promise<Result<ModuleMemory<Page>>>;
}
/**
 * ReflectExtension adds Astro Framework support.
 */
export declare class ReflectAstroExtension extends SDSService<ReflectAstroExtension, AstroExtensionInterface> implements ExtensionInterface {
    reflectExtension: boolean;
    private _rootDir;
    private _moduleLink;
    private _moduleMemories;
    private _autoImporter?;
    protected _untrackedModules: ModuleURL[];
    /**
     * The *rootDir* must be absolute absolute path. Example:
     *
     * ```
     * const rootDir = FilePath.getAbsolutePath('./test-app', import.meta.filename);
     * const astroReflect = new ReflectAstroFramework(FilePath.getAbsolutePath())
     * ```
     * @param rootDir
     */
    constructor(rootDir?: ModuleLink, setup?: Omit<SDSSetup<AstroExtensionInterface>, "packageLink">);
    getModuleWithFileExtensions(moduleLink: ModuleLink): ModuleLink[];
    get untrackedModuleAmount(): number;
    get memoryOperatorId(): ModuleLink;
    get packageLink(): ModuleLink;
    get moduleLink(): ModuleLink;
    get moduleMemories(): ModuleMemory<unknown>[];
    get moduleCategories(): string[];
    isSupportedModuleCategory(moduleCategory: string): boolean;
    get rootDir(): string;
    get srcDir(): string;
    putPackage(_: SingleRecord): Promise<Result<ModuleLink>>;
    /**
     * Put the modules, the Astro Framework's Reflect will require the modules
     * to be in the `this.srcDir`.
     * @param importedRecords
     * @returns
     */
    putModules(params: ImportedRecords | SingleRecord): Promise<Result<ModuleLink[]>>;
    watchModules: (autoImporter: AutoImporter) => void;
    private _autoPut;
    /**
     * @param moduleLink absolute path or a path relative to the `this.rootDir`
     * @returns
     */
    getModule<T>(moduleLink: ModuleLink): Result<ModuleMemory<T>>;
    getModules<T>(moduleCategory?: string): ModuleMemory<T>[];
    isModuleExist(moduleLink: ModuleLink | ModuleURL): boolean;
    getModuleContents<T>(moduleCategory?: string): T[];
    /**
     * Returns the modules whose content is undefined
     * @param moduleCategory
     * @returns
     */
    getNoContentModules<T>(moduleCategory?: string): ModuleMemory<T>[];
    afterCreation(): OkResult;
    protected _trackModules: (rest: Rest<ReflectElementType>) => OkResult;
    /**************************************************
     *
     * Hooks
     *
     **************************************************/
    beforePost(_selector: string, rest: Rest<ReflectElementType>, data?: ReflectElementType): Promise<OkResult>;
    afterPost(_selector: string, rest: Rest<ReflectElementType>, data?: ReflectElementType): Promise<OkResult>;
    /**
     * Check all modules and if no content is given, then return.
     * It also updates the memory by parsing the source code.
     * @param {ProjectMemory} projectMemory is used to identify the dependencies that page depends on.
     * @returns {Result<AraPage[]>}
     */
    private identifyContent;
    /**
     * All modules whose file extensions are considered as script (typescript, javascript) are converted
     * into the `Script` ontological data.
     * @returns
     */
    private identifyScriptContent;
    /**
     * All modules whose file extensions are considered as asset (markdown, react, and svg) are converted
     * into the `Asset` ontological data.
     * @returns
     */
    private identifyAssetContent;
    /**
     * Returns a page by it's path
     */
    getPageByUrl: (url: string | undefined) => Promise<Page | undefined>;
    /**
     * Responsbile with registering built in `Astro` in
     * the modules that ends with .astro file extension.
     * @param moduleMemory
     * @returns
     */
    private postBuiltInIdentifiers;
    /**
     * Before any request, we must import modules.
     * We must track the untracked modules.
     * @param rest
     * @param moduleCategory
     * @returns
     */
    private beforeAny;
}
