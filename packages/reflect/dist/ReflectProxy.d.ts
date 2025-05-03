import { Result, type ModuleLink } from "@ara-web/p-hintjens";
import { type ReflectProxyInterface, type ServiceMetaInterface } from "./reflect-interface.js";
export type Module = unknown;
export type ModulePath = string;
export type ModuleCategory = string;
export type AbsoluteFilePath = string;
/**
 * A type of imported records fetched by `import.meta.glob` if you use `vite` plugin.
 * The `importingFilePath` property is the module that records. You may set it using `import.meta.filename`
 */
export type ImportedRecords = {
    records: Record<ModulePath, Module>;
    importMetaFilename?: AbsoluteFilePath;
};
export type SingleRecord = {
    module: Module;
    importModuleClause: ModulePath;
    importMetaFilename?: AbsoluteFilePath;
};
/**
 * A function that imports the modules automatically before any `get` operation.
 */
export type AutoImporter = () => ImportedRecords;
/**
 * Extension Interface that all module handlers based on.
 */
export declare abstract class ReflectProxy implements ServiceMetaInterface, ReflectProxyInterface {
    private _description;
    private _moduleLink;
    private _proxies?;
    private _publicMethods;
    private _hidedMethods;
    get publicMethods(): string[];
    set publicMethods(value: string[]);
    constructor(_desc: string, _moduleLink: ModuleLink);
    get description(): string;
    get moduleLink(): ModuleLink;
    /**
     * Main source to call, proxifyMe will hide the methods of this instance and put behind
     * the first proxy.
     */
    proxifyMe<ProxyFront>(): Result<ProxyFront>;
    /**
     * Before using {@link proxify}, call this method to know what is the proxy of this proxy.
     * @param proxies
     */
    protected postProxies(proxies: ReflectProxy[]): void;
    protected hideByProxy(behindProxy: ReflectProxyInterface): void;
}
