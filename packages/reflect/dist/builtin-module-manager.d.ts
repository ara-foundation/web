import { type DataToObjectNode, type ModuleURL, type Restful, ModuleLink, ObjectNode, RestHandler, RestSynchronizer } from "@ara-web/sds";
import { OkResult, Result } from "@ara-web/p-hintjens";
import { ModuleMemory, type AutoImporter, type ModuleManager, type ModuleRecord, type ModuleRecords, type ReflectDataType } from "./index.js";
export declare enum ModuleCategory {
    NodeJsModule = "node_modules"
}
/**
 * Adds the support of the NodeJS built in context such Array, Record generics.
 */
export declare class BuiltinModuleManager implements ModuleManager {
    protected _moduleLink: ModuleLink;
    private _modules;
    private _restSync?;
    protected _restHandler: RestHandler;
    protected autoImporter?: AutoImporter;
    constructor();
    /**************************************
     * The SDS Extension methods
     *************************************/
    get packageLink(): ModuleLink;
    setRestSyncer(node: ObjectNode<ReflectDataType>, dataToObjectNode: DataToObjectNode<ReflectDataType>): void;
    /**
     * The rest handler of the nodejs module manager.
     */
    get extensionRestDispatcher(): RestHandler;
    get extensionRestQueue(): RestSynchronizer;
    /**************************************
     *  Module operators
     *************************************/
    get memories(): ModuleMemory<unknown>[];
    get categories(): string[];
    isDefinedModuleCategory(moduleCategory: string): boolean;
    isModuleExist(moduleLink: ModuleLink | ModuleURL): boolean;
    getModule<T>(moduleLink: ModuleLink | string): Result<ModuleMemory<T>>;
    getModules<T>(moduleCategory?: string): ModuleMemory<T>[];
    getModuleContents<T>(moduleCategory?: string): T[];
    getNoContentModules<T>(moduleCategory?: string): ModuleMemory<T>[];
    getModuleWithFileExtensions(_: ModuleLink): ModuleLink[];
    putPackage({ importModuleClause, module }: ModuleRecord): Promise<Result<ModuleLink>>;
    putModules(params: ModuleRecords | ModuleRecord): Promise<Result<ModuleLink[]>>;
    watchModules: (autoImporter: AutoImporter) => void;
    protected autoPost: () => Promise<Result<ModuleLink[]>>;
    beforeAny(rest: Restful<ReflectDataType>): Promise<OkResult>;
    /****************************************************************
     *
     * Rest handler
     *
     ****************************************************************/
    /**
     * Registering a new extension in run-time.
     * If extension exists, then it throws error asking to use Put.
     * @param parentOrBigBro
     * @param node
     * @param options
     * @returns
     */
    handleModuleAddition<DataType>(parentOrBigBro: ObjectNode<DataType>, node: ObjectNode<DataType>, options?: {
        lilBro?: boolean;
    }): Promise<OkResult>;
    handleModuleUpdate<DataType>(_selector: string, node: ObjectNode<DataType>, data: DataType): Promise<OkResult>;
    forwardPatch<DataType, AttrType>(_selector: string, _node: ObjectNode<DataType>, _attrValue: AttrType): Promise<OkResult>;
    handleModuleDeletion<DataType>(_selector: string, nodes: ObjectNode<DataType>[]): Promise<OkResult>;
}
