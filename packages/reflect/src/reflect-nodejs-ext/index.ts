import { ModuleLink, Rest } from "@ara-web/sds";
import { 
    Debug,
    EnumTraits,
    OkResult, 
    Result,
 } from "@ara-web/p-hintjens";
import { 
    ModuleMemory,
    type ImportedRecords, 
    BuiltInIdentifiers,
    type SingleRecord,
    type ReflectElementType
 } from "../index.js";
import { ReflectExtension } from "../reflect-extension.js";

export enum ModuleCategory {
    NodeJsModule = "node_modules",
}

/**
 * Adds the support of the NodeJS built in context such Array, Record generics.
 */
export class NodejsReflectExtension extends ReflectExtension {
    constructor() {
        super(ModuleLink.newPackageURL("@ara-web", "reflect-nodejs-ext", ModuleLink.newFileURL(import.meta.filename)));
    }

    public async putPackage({importModuleClause, module}: SingleRecord): Promise<Result<ModuleLink>> {
        return await super.putPackage({importModuleClause, module, moduleCategory: ModuleCategory.NodeJsModule});
    }

    public async putModules(params: ImportedRecords|SingleRecord): Promise<Result<ModuleLink[]>> {
        return await super.putModules({...params, moduleCategory: ModuleCategory.NodeJsModule});
    }

    public get untrackedModuleAmount(): number {
        return super.untrackedModuleAmount;
    }


    public get moduleCategories(): string[] {
        return EnumTraits.enumValues(ModuleCategory) as string[];
    }

    public isSupportedModuleCategory(moduleCategory: string): boolean {
        return this.moduleCategories.includes(moduleCategory);
    }

    //****************************************************************
    // 
    // Hooks
    //
    //****************************************************************

    public async beforeGet(_selector: string, rest: Rest<ReflectElementType>, _data?: ReflectElementType): Promise<OkResult> {
        const result = await this.beforeAny(rest);
        if (result.isFailure) {
            return OkResult.fail(`this.beforeAny(): ${result.errorTitle}`, result.errorDescription!);
        }
        return OkResult.ok();
    }

    public async beforePut(_selector: string, rest: Rest<ReflectElementType>, _data?: ReflectElementType): Promise<OkResult> {
        const result = await this.beforeAny(rest);
        if (result.isFailure) {
            return OkResult.fail(`this.beforeAny(): ${result.errorTitle}`, result.errorDescription!);
        }
        return OkResult.ok();
    }

    public async beforeDelete(_selector: string, rest: Rest<ReflectElementType>, _data?: ReflectElementType): Promise<OkResult> {
        const result = await this.beforeAny(rest);
        if (result.isFailure) {
            return OkResult.fail(`this.beforeAny(): ${result.errorTitle}`, result.errorDescription!);
        }
        return OkResult.ok();
    }

    public async beforePatch<AttrType>(_selector: string, rest: Rest<ReflectElementType>, _data?: AttrType): Promise<OkResult> {
        const result = await this.beforeAny(rest);
        if (result.isFailure) {
            return OkResult.fail(`this.beforeAny(): ${result.errorTitle}`, result.errorDescription!);
        }
        return OkResult.ok();
    }

    public async beforePost(_selector: string, rest: Rest<ReflectElementType>, data?: ReflectElementType): Promise<OkResult> {
        const beforeUpdate = await this.beforeAny(rest);
        if (beforeUpdate.isFailure) {
            return OkResult.fail(`this.beforeAny(): ${beforeUpdate.errorTitle}`, beforeUpdate.errorDescription!);
        }
        if (!(data instanceof ModuleMemory)) {
            return OkResult.ok();
        }

        if (data.moduleCategory !== ModuleCategory.NodeJsModule) {
            const builtInIdentified = await this.postBuiltInIdentifiers(data);
            if (builtInIdentified.isFailure) {
                return OkResult.fail(
                    `this.postBuiltInIdentifiers(): ${builtInIdentified.errorTitle}`,
                    builtInIdentified.errorDescription!
                )
            }
        }

        // This hook can be used to perform actions before posting data to modules.
        // For now, just return OkResult.ok() to satisfy the interface.
        return OkResult.ok();
    }

    public async afterPost(_selector: string, _rest: Rest<ReflectElementType>, data?: ReflectElementType): Promise<OkResult> {
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

    private async beforeAny(rest: Rest<ReflectElementType>): Promise<OkResult> {
        if (this._autoImporter !== undefined) {
            const result = await this._autoPut(ModuleCategory.NodeJsModule);
            if (result.isFailure) {
                return OkResult.fail(`this._autoPut(): ${result.errorTitle}`, result.errorDescription!);
            }
        }

        const tracked = this._trackModules(rest);
        if (tracked.isFailure) {
            return OkResult.fail(`this._trackModules(): ${tracked.errorTitle}`, tracked.errorDescription!);
        }

        return OkResult.ok();
    }

    //****************************************************************
    // 
    // Internal
    //
    //****************************************************************

    private postNodeJSContents = (module: ModuleMemory<unknown>): void => {
        module.content = module.glob;
    }

    //
    // Adds the Array, Object and other classes, types that are available in the Environment
    // Except for the NodeJS extension itself.
    //
    private postBuiltInIdentifiers = async (moduleMemory: ModuleMemory<unknown>): Promise<Result<ModuleMemory<unknown>>> => {
        const identifiers = await BuiltInIdentifiers.getBuiltInIdentifiers();
        if (identifiers.isFailure) {
            return Result.fail(
                `getBuiltInIdentifiers(): ${identifiers.errorTitle}`,
                identifiers.errorDescription!
            )
        }

        const importIdentifiersCount = Object.keys(identifiers.getValue()).length;
        if (importIdentifiersCount === 0) {
            return Result.ok(moduleMemory);
        }
        
        identifiers.getValue().forEach(
            (codePiece) => {
                moduleMemory.rest.post!('*', codePiece, {})
            }
        )
        return Result.ok(moduleMemory);
    }

}