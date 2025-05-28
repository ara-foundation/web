import { LinkTraits, ModuleLink, ObjectNode, RestHandler, RestSynchronizer, } from "@ara-web/sds";
import { Debug, EnumTraits, OkResult, Result, } from "@ara-web/p-hintjens";
import { FilePath, MODULE_MEMORY_TAG, MEMOP_TAG, escapeId, Module, } from "./index.js";
export var ModuleCategory;
(function (ModuleCategory) {
    ModuleCategory["NodeJsModule"] = "node_modules";
})(ModuleCategory || (ModuleCategory = {}));
/**
 * Adds the support of the NodeJS built in context such Array, Record generics.
 */
export class BuiltinModuleManager {
    _moduleLink;
    _modules;
    _restSync;
    // If rest has operations related to the module memories with
    // the ModuleCategory.NodeJsModule category,
    // then it will use this method.
    _restHandler;
    autoImporter;
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
    get packageLink() {
        return this._moduleLink;
    }
    setRestSyncer(node, dataToObjectNode) {
        this._restSync = new RestSynchronizer(node, dataToObjectNode);
    }
    /**
     * The rest handler of the nodejs module manager.
     */
    get extensionRestDispatcher() {
        return this._restHandler;
    }
    get extensionRestQueue() {
        return this._restSync;
    }
    /**************************************
     *  Module operators
     *************************************/
    get modules() {
        return Object.values(this._modules);
    }
    get categories() {
        return EnumTraits.enumValues(ModuleCategory);
    }
    isDefinedModuleCategory(moduleCategory) {
        return this.categories.includes(moduleCategory);
    }
    isModuleExist(moduleLink) {
        let url = typeof moduleLink === "string" ? moduleLink : moduleLink.url;
        if (this._modules[url] !== undefined) {
            return true;
        }
        return false;
    }
    getModule(moduleLink) {
        if (typeof moduleLink === "string") {
            return Result.fail(`${this._moduleLink.url} accepts module links only`, `Please pass the absolute path`);
        }
        if (!this.isModuleExist(moduleLink)) {
            return Result.errorCode404([this._moduleLink.url], `this.isModuleExist()`, `The link: ${moduleLink}`);
        }
        let module = this._modules[moduleLink.url];
        return Result.ok(module);
    }
    getModules(moduleCategory) {
        const modules = this.modules.filter(module => moduleCategory === undefined || module.category === moduleCategory);
        return modules;
    }
    getModuleWithFileExtensions(_) {
        return [];
    }
    async putPackage({ importModuleClause, module }) {
        const moduleLink = ModuleLink.newPackageURLFromImportClause(importModuleClause);
        const moduleMemory = new Module(ModuleCategory.NodeJsModule, moduleLink, module);
        this._modules[moduleLink.url] = moduleMemory;
        return Result.ok(moduleLink);
    }
    async putModules(params) {
        const importingFilePath = params.importMetaFilename ? params.importMetaFilename : FilePath.getCurrentWorkingDir();
        const moduleLinks = [];
        if ("records" in params) {
            Debug.log(`Put modules`);
            const importedRecords = params;
            for (let filePath in importedRecords.records) {
                const moduleLink = FilePath.getFileAbsolutePath(filePath, importingFilePath);
                if (!(FilePath.isFileExist(moduleLink))) {
                    return Result.fail(`FilePath.isFileExist('${moduleLink.url}'): not found`, `Make sure absolute path is created from '${filePath}' relative to '${importedRecords.importMetaFilename}' locates to a file`);
                }
                const moduleMemory = new Module(ModuleCategory.NodeJsModule, moduleLink, importedRecords.records[filePath]);
                this._modules[moduleLink.url] = moduleMemory;
                moduleLinks.push(moduleLink);
            }
        }
        else if ("module" in params) {
            const singleRecord = params;
            const moduleLink = FilePath.getFileAbsolutePath(singleRecord.importModuleClause, importingFilePath);
            if (!(FilePath.isFileExist(moduleLink))) {
                return Result.fail(`FilePath.isFileExist('${moduleLink.url}'): not found`, `Make sure absolute path is created from '${singleRecord.importModuleClause}' relative to '${singleRecord.importMetaFilename}' locates to a file`);
            }
            const moduleMemory = new Module(ModuleCategory.NodeJsModule, moduleLink, singleRecord.module);
            this._modules[moduleLink.url] = moduleMemory;
            moduleLinks.push(moduleLink);
        }
        else {
            return Result.fail(`Missing records and importModules properties`, `Pass the correct data`);
        }
        if (moduleLinks.length === 0) {
            return Result.fail(`No record to put in`, `Please pass the correct node`);
        }
        return Result.ok(moduleLinks);
    }
    watchModules = (autoImporter) => {
        this.autoImporter = autoImporter;
    };
    autoPost = async () => {
        if (this.autoImporter === undefined) {
            return Result.ok([]);
        }
        const imported = this.autoImporter();
        const putResult = await this.putModules(imported);
        if (putResult.isFailure) {
            return Result.fail(`this.putModules(): ${putResult.errorTitle}`, putResult.errorDescription);
        }
        return Result.ok(putResult.getValue());
    };
    //****************************************************************
    // 
    // Hooks
    //
    //****************************************************************
    async beforeAny(rest) {
        if (this.autoImporter !== undefined) {
            const result = await this.autoPost();
            if (result.isFailure) {
                return OkResult.fail(`this.autoPost(): ${result.errorTitle}`, result.errorDescription);
            }
        }
        let objNode = undefined;
        for (const moduleURLStr in this._modules) {
            const moduleURL = moduleURLStr;
            if (!this._restSync.pendingKeys.has(moduleURL)) {
                // Very important line.
                // If it's given at the end, then when trying
                // to get the parent object node, it will
                // enter into an infinite cycle. get -> beforeAny -> get...
                this._restSync.pendingKeys.add(moduleURL);
                if (objNode === undefined) {
                    objNode = await rest.get(`#${escapeId(this._moduleLink.url)}`);
                    if (objNode === null) {
                        return OkResult.fail(`The nodejs extension not found`, `Are you sure it exists in the rest?`);
                    }
                }
                const moduleElement = rest.dataToObjectNode(this._modules[moduleURL], objNode);
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
    async handleModuleAddition(parentOrBigBro, node, options) {
        const tag = LinkTraits.getTagName(parentOrBigBro.selector);
        if (options?.lilBro) {
            if (tag !== this._restHandler.tag) {
                return OkResult.ok();
            }
        }
        else {
            if (tag !== MEMOP_TAG) {
                return OkResult.ok();
            }
        }
        // Now, let's make sure it exists
        if (!this._restHandler.isMatchingTag(node.selector)) {
            return OkResult.fail(`The node is in the root, but it's tag isn't ${this._restHandler.tag}`, `The ${node.selector} expected to be an module memory`);
        }
        const data = node.data;
        if (data === null || !(data instanceof Module)) {
            return OkResult.fail(`The data is not an instance of module memory`, `Please update it`);
        }
        const moduleMemory = this._modules[data.link.url];
        if (moduleMemory) {
            return OkResult.fail(`The module memory exists already`, `Can not post duplicate of ${data.link.url}. Call rest.put instead.`);
        }
        this._modules[data.link.url] = data;
        return OkResult.ok();
    }
    async handleModuleUpdate(_selector, node, data) {
        // Only children of MEMOP_SELECTOR are considered to be extensions.
        if (node.parent === undefined || LinkTraits.getTagName(node.parent?.selector) !== MEMOP_TAG) {
            return OkResult.ok();
        }
        // Now, let's make sure it exists
        if (!this._restHandler.isMatchingTag(node.selector)) {
            return OkResult.fail(`The node is in the root, but it's tag isn't ${this._restHandler.tag}`, `The ${node.selector} expected to be a module`);
        }
        if (node.data === null || !(node.data instanceof Module)) {
            return OkResult.fail(`The node that we try to put data is not module memory`, `Please update it`);
        }
        if (!(data instanceof Module)) {
            return OkResult.fail(`The data is not module memory`, `Please update the 'data' argument`);
        }
        if (node.data.link.isEqual(data.link)) {
            return OkResult.fail(`The data that you are trying to put has incorrect module url`, `The extension you are trying to implement has '${data.link}', while data to put has '${data.link}', please update your data's module link.`);
        }
        if (this._modules[node.data.link.url] === undefined) {
            return OkResult.fail(`The module memory not found`, `Can not find ${node.data.link.url}. Call rest.post instead.`);
        }
        this._modules[node.data.link.url] = data;
        return OkResult.ok();
    }
    async forwardPatch(_selector, _node, _attrValue) {
        return OkResult.ok();
    }
    async handleModuleDeletion(_selector, nodes) {
        const moduleURLs = nodes
            .filter(node => this._restHandler.isMatchingTag(node.selector))
            .map(node => node.data)
            .filter(el => el !== null && (el instanceof Module))
            .map(moduleMemory => moduleMemory.link.url)
            .filter(moduleURL => this._modules[moduleURL] !== undefined);
        if (moduleURLs.length === 0) {
            return OkResult.ok();
        }
        for (const moduleURL of moduleURLs) {
            delete this._modules[moduleURL];
            this._restSync.pendingKeys.delete(moduleURL);
        }
        return OkResult.ok();
    }
}
