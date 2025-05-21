import { ModuleLink, Rest } from "@ara-web/sds";
import { EnumTraits, OkResult, Result, } from "@ara-web/p-hintjens";
import { ModuleMemory, BuiltInIdentifiers } from "../index.js";
import { ReflectExtension } from "../reflect-extension.js";
export var ModuleCategory;
(function (ModuleCategory) {
    ModuleCategory["NodeJsModule"] = "node_modules";
})(ModuleCategory || (ModuleCategory = {}));
/**
 * Adds the support of the NodeJS built in context such Array, Record generics.
 */
export class NodejsReflectExtension extends ReflectExtension {
    constructor() {
        super(ModuleLink.newPackageURL("@ara-web", "reflect-nodejs-ext", ModuleLink.newFileURL(import.meta.filename)));
    }
    async putPackage({ importModuleClause, module }) {
        return await super.putPackage({ importModuleClause, module, moduleCategory: ModuleCategory.NodeJsModule });
    }
    async putModules(params) {
        return await super.putModules({ ...params, moduleCategory: ModuleCategory.NodeJsModule });
    }
    get untrackedModuleAmount() {
        return super.untrackedModuleAmount;
    }
    get moduleCategories() {
        return EnumTraits.enumValues(ModuleCategory);
    }
    isSupportedModuleCategory(moduleCategory) {
        return this.moduleCategories.includes(moduleCategory);
    }
    //****************************************************************
    // 
    // Hooks
    //
    //****************************************************************
    async beforeGet(_selector, rest, _data) {
        const result = await this.beforeAny(rest);
        if (result.isFailure) {
            return OkResult.fail(`this.beforeAny(): ${result.errorTitle}`, result.errorDescription);
        }
        return OkResult.ok();
    }
    async beforePut(_selector, rest, _data) {
        const result = await this.beforeAny(rest);
        if (result.isFailure) {
            return OkResult.fail(`this.beforeAny(): ${result.errorTitle}`, result.errorDescription);
        }
        return OkResult.ok();
    }
    async beforeDelete(_selector, rest, _data) {
        const result = await this.beforeAny(rest);
        if (result.isFailure) {
            return OkResult.fail(`this.beforeAny(): ${result.errorTitle}`, result.errorDescription);
        }
        return OkResult.ok();
    }
    async beforePatch(_selector, rest, _data) {
        const result = await this.beforeAny(rest);
        if (result.isFailure) {
            return OkResult.fail(`this.beforeAny(): ${result.errorTitle}`, result.errorDescription);
        }
        return OkResult.ok();
    }
    async beforePost(_selector, rest, data) {
        const beforeUpdate = await this.beforeAny(rest);
        if (beforeUpdate.isFailure) {
            return OkResult.fail(`this.beforeAny(): ${beforeUpdate.errorTitle}`, beforeUpdate.errorDescription);
        }
        if (!(data instanceof ModuleMemory)) {
            return OkResult.ok();
        }
        if (data.moduleCategory !== ModuleCategory.NodeJsModule) {
            const builtInIdentified = await this.postBuiltInIdentifiers(data);
            if (builtInIdentified.isFailure) {
                return OkResult.fail(`this.postBuiltInIdentifiers(): ${builtInIdentified.errorTitle}`, builtInIdentified.errorDescription);
            }
        }
        // This hook can be used to perform actions before posting data to modules.
        // For now, just return OkResult.ok() to satisfy the interface.
        return OkResult.ok();
    }
    async afterPost(_selector, _rest, data) {
        if (!(data instanceof ModuleMemory)) {
            return OkResult.ok();
        }
        if (data.moduleCategory === ModuleCategory.NodeJsModule) {
            this.postNodeJSContents(data);
        }
        return OkResult.ok();
    }
    //****************************************************************
    // 
    // Internal
    //
    //****************************************************************
    async beforeAny(rest) {
        if (this._autoImporter !== undefined) {
            const result = await this._autoPut(ModuleCategory.NodeJsModule);
            if (result.isFailure) {
                return OkResult.fail(`this._autoPut(): ${result.errorTitle}`, result.errorDescription);
            }
        }
        const tracked = this._trackModules(rest);
        if (tracked.isFailure) {
            return OkResult.fail(`this._trackModules(): ${tracked.errorTitle}`, tracked.errorDescription);
        }
        return OkResult.ok();
    }
    //****************************************************************
    // 
    // Internal
    //
    //****************************************************************
    postNodeJSContents = (module) => {
        module.content = module.glob;
    };
    //
    // Adds the Array, Object and other classes, types that are available in the Environment
    // Except for the NodeJS extension itself.
    //
    postBuiltInIdentifiers = async (moduleMemory) => {
        const identifiers = await BuiltInIdentifiers.getBuiltInIdentifiers();
        if (identifiers.isFailure) {
            return Result.fail(`getBuiltInIdentifiers(): ${identifiers.errorTitle}`, identifiers.errorDescription);
        }
        const importIdentifiersCount = Object.keys(identifiers.getValue()).length;
        if (importIdentifiersCount === 0) {
            return Result.ok(moduleMemory);
        }
        let failedPostResult = OkResult.ok();
        identifiers.getValue().forEach((codePiece) => {
            if (failedPostResult.isSuccess) {
                failedPostResult = moduleMemory.rest.post('*', codePiece, {});
            }
        });
        if (failedPostResult.isFailure) {
            return Result.fail(`moduleMemory.rest.post(builtInIdentifiers): ${failedPostResult.errorTitle}`, failedPostResult.errorDescription);
        }
        return Result.ok(moduleMemory);
    };
}
