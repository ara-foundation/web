import { type AutoImporter, type ExtensionInterface, type ImportedRecords, ModuleMemory, ProjectMemory, type SingleRecord } from "@ara-web/reflect";
import { OkResult, Result, ModuleLink, type ModuleURL } from "@ara-web/p-hintjens";
import { type Page } from "./ontology/index.js";
/**
 * ReflectExtension adds Astro Framework support.
 */
export declare class ReflectAstroFramework implements ExtensionInterface {
    private _rootDir;
    private _moduleLink;
    private _moduleMemories;
    private _autoImporter?;
    /**
     * The *rootDir* must be absolute absolute path. Example:
     *
     * ```
     * const rootDir = FilePath.getAbsolutePath('./test-app', import.meta.filename);
     * const astroReflect = new ReflectAstroFramework(FilePath.getAbsolutePath())
     * ```
     * @param rootDir
     */
    constructor(rootDir?: ModuleLink);
    getModuleWithFileExtensions(moduleLink: ModuleLink): ModuleLink[];
    get operatorId(): ModuleLink;
    get moduleLink(): ModuleLink;
    get moduleMemories(): ModuleMemory<unknown>[];
    get description(): string;
    get moduleCategories(): string[];
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
    isSupportedModuleCategory(moduleCategory: string): boolean;
    /**
     * Called by the `@ara-web/reflect` before fetching anything, so that Astro Framework
     * could convert the required module from file system for example, and convert that module
     * into the ontological data.
     * @param moduleCategory
     * @param projectMemory
     * @returns
     */
    beforeGet?: ((moduleCategory: string, projectMemory: ProjectMemory) => Promise<OkResult>) | undefined;
    /**
     * Identifies the data of the component modules.
     * @notice Components are not evaluated by internal structures.
     * @param {ProjectMemory} projectMemory is used if the layout depends on another modules
     */
    private identifyComponentContents;
    /**
     * Identifies the data of the layout modules.
     * @param {ProjectMemory} projectMemory is used if the layout depends on another modules
     */
    private postLayoutContents;
    /**
     * Check all modules and if no content is given, then return.
     * It also updates the memory by parsing the source code.
     * @param {ProjectMemory} projectMemory is used to identify the dependencies that page depends on.
     * @returns {Result<AraPage[]>}
     */
    private postPageContents;
    /**
     * All modules whose file extensions are considered as script (typescript, javascript) are converted
     * into the `Script` ontological data.
     * @returns
     */
    private postScripts;
    /**
     * All modules whose file extensions are considered as asset (markdown, react, and svg) are converted
     * into the `Asset` ontological data.
     * @returns
     */
    private postAssets;
    /**
     * Returns a page by it's path
     */
    getPageByUrl: (url: string | undefined) => Promise<Page | undefined>;
}
