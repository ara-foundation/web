import { 
    type DataToObjectNode,
    type Extendable,
    type ModuleURL,
    type Restful,
    LinkTraits,
    ModuleLink, 
    ObjectNode, 
    RestHandler,
    RestSynchronizer, 
} from "@ara-web/sds";
import { 
    Debug,
    EnumTraits,
    OkResult, 
    Result,
 } from "@ara-web/p-hintjens";
import { 
    ModuleMemory,
    type AutoImporter,
    FilePath,
    MODULE_MEMORY_TAG,
    type ModuleMemories,
    MEMOP_TAG,
    escapeId,
    type ModuleManager,
    type ModuleRecord,
    type ModuleRecords,
    type ReflectDataType,
 } from "./index.js";

export enum ModuleCategory {
    NodeJsModule = "node_modules",
}

/**
 * Adds the support of the NodeJS built in context such Array, Record generics.
 */
export class BuiltinModuleManager implements ModuleManager {
    protected _moduleLink: ModuleLink;
    private _modules: ModuleMemories<unknown>;
    private _restSync?: RestSynchronizer;

    // If rest has operations related to the module memories with
    // the ModuleCategory.NodeJsModule category,
    // then it will use this method.
    protected _restHandler: RestHandler;
    protected autoImporter?: AutoImporter;

    constructor() {
        this._moduleLink = ModuleLink.newPackageLink("@ara-web", "reflect-nodejs-ext");
        this._modules = {};
        this._restHandler = new RestHandler(this._moduleLink, MODULE_MEMORY_TAG);
        this._restHandler.handlePost = this.handleModuleAddition.bind(this);
        this._restHandler.handlePut = this.handleModuleUpdate.bind(this);
        this._restHandler.handleDelete = this.handleModuleDeletion.bind(this);
    }

    /**************************************
     * The SDS Extension methods
     *************************************/
    public get packageLink(): ModuleLink {
        return this._moduleLink;
    }

    setRestSyncer(node: ObjectNode<ReflectDataType>, dataToObjectNode: DataToObjectNode<ReflectDataType>): void {
        this._restSync = new RestSynchronizer(node, dataToObjectNode);
    }
    
    /**
     * The rest handler of the nodejs module manager.
     */
    public get extensionRestDispatcher(): RestHandler {
        return this._restHandler;
    }

    public get extensionRestQueue(): RestSynchronizer {
        return this._restSync!;
    }

    /**************************************
     *  Module operators
     *************************************/

    public get memories(): ModuleMemory<unknown>[] {
        return Object.values(this._modules);
    }

    public get categories(): string[] {
        return EnumTraits.enumValues(ModuleCategory) as string[];
    }

    public isDefinedModuleCategory(moduleCategory: string): boolean {
        return this.categories.includes(moduleCategory);
    }

    public isModuleExist(moduleLink: ModuleLink | ModuleURL): boolean {
        let url = typeof moduleLink === "string" ? moduleLink : moduleLink.url;
        if (this._modules[url] !== undefined) {
            return true;
        }
        return false;
    }
    
    public getModule<T>(moduleLink: ModuleLink|string): Result<ModuleMemory<T>> {
        if (typeof moduleLink === "string") {
            return Result.fail(`${this._moduleLink.url} accepts module links only`, `Please pass the absolute path`)
        }
        if (!this.isModuleExist(moduleLink)) {
            return Result.errorCode404([this._moduleLink.url], `this.isModuleExist()`, `The link: ${moduleLink}`)
        }
        let module = this._modules[moduleLink.url] as ModuleMemory<T>;
        return Result.ok(module)
    }

    public getModules<T>(moduleCategory?: string): ModuleMemory<T>[] {
        const moduleMemories: ModuleMemory<T>[] = [];
        for (let moduleMemory of this.memories) {
            if (moduleCategory === undefined || moduleMemory.moduleCategory === moduleCategory) {
                moduleMemories.push(moduleMemory as ModuleMemory<T>);
            }
        }
        return moduleMemories;
    }

    public getModuleContents<T>(moduleCategory?: string): T[] {
        const moduleMemories = this.getModules(moduleCategory);

        return moduleMemories.map((memory) => (memory.content as T))
    }

    public getNoContentModules<T>(moduleCategory?: string): ModuleMemory<T>[] {
        const moduleMemories = this.getModules<T>(moduleCategory);

        return moduleMemories.filter((memory) => (memory.content === undefined));
    }

    public getModuleWithFileExtensions(_: ModuleLink): ModuleLink[] {
        return [];
    }

    public async putPackage({importModuleClause, module}: ModuleRecord): Promise<Result<ModuleLink>> {
        const moduleLink = ModuleLink.newPackageURLFromImportClause(importModuleClause);
        const moduleMemory = new ModuleMemory(ModuleCategory.NodeJsModule, moduleLink, module);
        this._modules[moduleLink.url] = moduleMemory;
        return Result.ok(moduleLink);
    }

    public async putModules(params: ModuleRecords|ModuleRecord): Promise<Result<ModuleLink[]>> {
        const importingFilePath = params.importMetaFilename ? params.importMetaFilename : FilePath.getCurrentWorkingDir();
        const moduleLinks: ModuleLink[] = [];
        if ("records" in params) {
            Debug.log(`Put modules`);
            const importedRecords = params as ModuleRecords;
            for (let filePath in importedRecords.records) {
                const moduleLink = FilePath.getFileAbsolutePath(filePath, importingFilePath);
                if (!(FilePath.isFileExist(moduleLink))) {
                    return Result.fail(`FilePath.isFileExist('${moduleLink.url}'): not found`, `Make sure absolute path is created from '${filePath}' relative to '${importedRecords.importMetaFilename}' locates to a file`)
                }

                const moduleMemory = new ModuleMemory(ModuleCategory.NodeJsModule, moduleLink, importedRecords.records[filePath]);
                moduleMemory.content = moduleMemory.glob;
                this._modules[moduleLink.url] = moduleMemory;
                moduleLinks.push(moduleLink);
            }
        } else if ("module" in params) {
            const singleRecord = params as ModuleRecord;
            const moduleLink = FilePath.getFileAbsolutePath(singleRecord.importModuleClause, importingFilePath);
            if (!(FilePath.isFileExist(moduleLink))) {
                return Result.fail(`FilePath.isFileExist('${moduleLink.url}'): not found`, `Make sure absolute path is created from '${singleRecord.importModuleClause}' relative to '${singleRecord.importMetaFilename}' locates to a file`)
            }
            const moduleMemory = new ModuleMemory(ModuleCategory.NodeJsModule, moduleLink, singleRecord.module);
            moduleMemory.content = moduleMemory.glob;
            this._modules[moduleLink.url] = moduleMemory;
            moduleLinks.push(moduleLink);
        } else {
            return Result.fail(`Missing records and importModules properties`, `Pass the correct data`);
        }

        if (moduleLinks.length === 0) {
            return Result.fail(`No record to put in`, `Please pass the correct node`);
        }
        return Result.ok(moduleLinks);
    }

    public watchModules = (autoImporter: AutoImporter) => {
        this.autoImporter = autoImporter;
    }

    protected autoPost = async(): Promise<Result<ModuleLink[]>> => {
        if (this.autoImporter === undefined) {
            return Result.ok([]);
        }
        const imported = this.autoImporter();
        const putResult = await this.putModules(imported);
        if (putResult.isFailure) {
            return Result.fail(`this.putModules(): ${putResult.errorTitle}`, putResult.errorDescription!);
        }
        return Result.ok(putResult.getValue());
    }

    //****************************************************************
    // 
    // Hooks
    //
    //****************************************************************

    public async beforeAny(rest: Restful<ReflectDataType>): Promise<OkResult> {
        if (this.autoImporter !== undefined) {
            const result = await this.autoPost();
            if (result.isFailure) {
                return OkResult.fail(`this.autoPost(): ${result.errorTitle}`, result.errorDescription!);
            }
        }

        let objNode: ObjectNode<ReflectDataType> | null | undefined = undefined;

        for (const moduleURLStr in this._modules) {
            const moduleURL = moduleURLStr as ModuleURL;
            if (!this._restSync!.pendingKeys.has(moduleURL)) {
                // Very important line.
                // If it's given at the end, then when trying
                // to get the parent object node, it will
                // enter into an infinite cycle. get -> beforeAny -> get...
                this._restSync!.pendingKeys.add(moduleURL);
                if (objNode === undefined) {
                    objNode = await rest.get!(`#${escapeId(this._moduleLink.url)}`)
                    if (objNode === null) {
                        return OkResult.fail(`The nodejs extension not found`, `Are you sure it exists in the rest?`);
                    }
                }

                const moduleElement = rest.dataToObjectNode!(this._modules[moduleURL], objNode!);
                objNode.appendChild(moduleElement);
            }
        }

        return OkResult.ok();
    }

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
    async handleModuleAddition<DataType>(
        parentOrBigBro: ObjectNode<DataType>,
        node: ObjectNode<DataType>,
        options?: { lilBro?: boolean }
    ): Promise<OkResult> {
        const tag = LinkTraits.getTagName(parentOrBigBro.selector);
        if (options?.lilBro) {
            if (tag !== this._restHandler.tag) {
                return OkResult.ok();
            }
        } else {
            if (tag !== MEMOP_TAG) {
                return OkResult.ok();
            }
        }
        
        // Now, let's make sure it exists
        if (!this._restHandler.isMatchingTag(node.selector)) {
            return OkResult.fail(`The node is in the root, but it's tag isn't ${this._restHandler.tag}`, `The ${node.selector} expected to be an module memory`);
        }

        const data = node.data;
        if (data === null || !(data instanceof ModuleMemory)) {
            return OkResult.fail(`The data is not an instance of module memory`, `Please update it`);
        }

        const moduleMemory = this._modules[data.moduleLink.url];
        if (moduleMemory) {
            return OkResult.fail(`The module memory exists already`, `Can not post duplicate of ${data.moduleLink.url}. Call rest.put instead.`);
        }
        
        this._modules[data.moduleLink.url] = data;

        return OkResult.ok();
    }

    async handleModuleUpdate<DataType>(
        _selector: string,
        node: ObjectNode<DataType>,
        data: DataType
    ): Promise<OkResult> {
        // Only children of MEMOP_SELECTOR are considered to be extensions.
        if (node.parent === undefined || LinkTraits.getTagName(node.parent?.selector!) !== MEMOP_TAG) {
            return OkResult.ok();
        }
        // Now, let's make sure it exists
        if (!this._restHandler.isMatchingTag(node.selector)) {
            return OkResult.fail(`The node is in the root, but it's tag isn't ${this._restHandler.tag}`, `The ${node.selector} expected to be a module`);
        }
        
        if (node.data === null || !(node.data instanceof ModuleMemory)) {
            return OkResult.fail(`The node that we try to put data is not module memory`, `Please update it`);
        }
        if (!(data instanceof ModuleMemory)) {
            return OkResult.fail(`The data is not module memory`, `Please update the 'data' argument`);
        }
        if (node.data!.moduleLink.isEqual(data.moduleLink)) {
            return OkResult.fail(
                `The data that you are trying to put has incorrect module url`,
                `The extension you are trying to implement has '${data.moduleLink}', while data to put has '${data.moduleLink}', please update your data's module link.`
            )
        }

        if (this._modules[node.data.moduleLink.url] === undefined) {
            return OkResult.fail(`The module memory not found`, `Can not find ${node.data.moduleLink.url}. Call rest.post instead.`);
        }
        
        this._modules[node.data.moduleLink.url] = data;

        return OkResult.ok();
    }

    async forwardPatch<DataType, AttrType>(
        _selector: string,
        _node: ObjectNode<DataType>,
        _attrValue: AttrType,
    ): Promise<OkResult> {
        return OkResult.ok();
    }

    async handleModuleDeletion<DataType>(
        _selector: string, nodes: ObjectNode<DataType>[]
    ): Promise<OkResult> {
        const moduleURLs = nodes
            .filter(node => this._restHandler.isMatchingTag(node.selector))
            .map(node => node.data)
            .filter(el => el !== null && (el instanceof ModuleMemory))
            .map(moduleMemory => moduleMemory.moduleLink.url)
            .filter(moduleURL => this._modules[moduleURL] !== undefined)
        if (moduleURLs.length === 0) {
            return OkResult.ok();
        }
        for (const moduleURL of moduleURLs) {
            delete this._modules[moduleURL];
            this._restSync!.pendingKeys.delete(moduleURL);
        }
        return OkResult.ok();
    }

    //****************************************************************
    // 
    // Internal
    //
    //****************************************************************

    // //
    // // Adds the Array, Object and other classes, types that are available in the Environment
    // // Except for the NodeJS extension itself.
    // //
    // private postBuiltInIdentifiers = async (moduleMemory: ModuleMemory<unknown>): Promise<Result<ModuleMemory<unknown>>> => {
    //     const identifiers = await BuiltInIdentifiers.getBuiltInIdentifiers();
    //     if (identifiers.isFailure) {
    //         return Result.fail(
    //             `getBuiltInIdentifiers(): ${identifiers.errorTitle}`,
    //             identifiers.errorDescription!
    //         )
    //     }

    //     const importIdentifiersCount = Object.keys(identifiers.getValue()).length;
    //     if (importIdentifiersCount === 0) {
    //         return Result.ok(moduleMemory);
    //     }
        

    //     for (const codePiece of identifiers.getValue()) {
    //         const failedPostResult = await moduleMemory.rest.post!('*', codePiece)
    //         if (failedPostResult.isFailure) {
    //             return Result.fail(`moduleMemory.rest.post(builtInIdentifiers): ${failedPostResult.errorTitle}`, failedPostResult.errorDescription!)
    //         }
    //     }
    //     return Result.ok(moduleMemory);
    // }
}