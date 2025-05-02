import { Result, type ModuleLink } from "@ara-web/ts-enhancement";
import { 
    type ReflectProxyInterface, 
    type ServiceMetaInterface
} from "./reflect-interface.js";

export type Module = unknown;
export type ModulePath = string;
export type ModuleCategory = string;
export type AbsoluteFilePath = string;

/**
 * A type of imported records fetched by `import.meta.glob` if you use `vite` plugin.
 * The `importingFilePath` property is the module that records. You may set it using `import.meta.filename`
 */
export type ImportedRecords = {records: Record<ModulePath, Module>, importMetaFilename?: AbsoluteFilePath};
export type SingleRecord =  {module: Module, importModuleClause: ModulePath, importMetaFilename?: AbsoluteFilePath}
/**
 * A function that imports the modules automatically before any `get` operation.
 */
export type AutoImporter = () => ImportedRecords;

/**
 * Extension Interface that all module handlers based on.
 */
export abstract class ReflectProxy implements ServiceMetaInterface, ReflectProxyInterface {
    private _description: string;
    private _moduleLink: ModuleLink;
    private _proxies?: ReflectProxy[];
    private _publicMethods: string[] = [];
    private _hidedMethods: object = {};
    public get publicMethods(): string[] {
        return this._publicMethods;
    }
    public set publicMethods(value: string[]) {
        this._publicMethods = value;
    }

    constructor(_desc: string, _moduleLink: ModuleLink) {
        this._description = _desc;
        this._moduleLink = _moduleLink;
    }

    public get description(): string {
        return this._description;
    }

    public get moduleLink(): ModuleLink {
        return this._moduleLink;
    }

    /**
     * Main source to call, proxifyMe will hide the methods of this instance and put behind
     * the first proxy.
     */
    public proxifyMe<ProxyFront>(): Result<ProxyFront> {
        if (this.publicMethods !== undefined && this.publicMethods.length > 0) {
            this.hideByProxy(this);
        }

        if (this._proxies === undefined || this._proxies.length === 0) {
            return Result.ok(this as unknown as ProxyFront);
        }

        const proxy = this._proxies.shift();
        if (proxy === undefined) {
            return Result.ok(this as unknown as ProxyFront);
        }
        if ((proxy as ReflectProxyInterface).putBehindData !== undefined) {
            const obj: any = {...this, ...this._hidedMethods};
            (proxy as ReflectProxyInterface).putBehindData!(obj);
        }
        proxy.postProxies(this._proxies);

        const proxified = proxy.proxifyMe<ProxyFront>();
        if (proxified.isFailure) {
            return Result.fail(`proxy.proxifyMe(): ${proxified.errorTitle}`, proxified.errorDescription!)
        }

        return Result.ok(proxified.getValue());
    }

    /**
     * Before using {@link proxify}, call this method to know what is the proxy of this proxy.
     * @param proxies 
     */
    protected postProxies(proxies: ReflectProxy[]): void {
        this._proxies = proxies;
    }

    protected hideByProxy(behindProxy: ReflectProxyInterface): void {
        if (Object.keys(this._hidedMethods).length > 0 || behindProxy.publicMethods === undefined) {
            return;
        }
        for(let pubKey of behindProxy.publicMethods) {
            (this._hidedMethods as any)[pubKey] = (behindProxy as any)[pubKey as keyof this];
            (behindProxy as any)[pubKey as keyof this] = undefined;
        }
    }
}
