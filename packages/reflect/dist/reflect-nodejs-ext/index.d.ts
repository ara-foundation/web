import { ModuleLink, Rest } from "@ara-web/sds";
import { OkResult, Result } from "@ara-web/p-hintjens";
import { type ImportedRecords, type SingleRecord, type ReflectElementType } from "../index.js";
import { ReflectExtension } from "../reflect-extension.js";
export declare enum ModuleCategory {
    NodeJsModule = "node_modules"
}
/**
 * Adds the support of the NodeJS built in context such Array, Record generics.
 */
export declare class NodejsReflectExtension extends ReflectExtension {
    constructor();
    putPackage({ importModuleClause, module }: SingleRecord): Promise<Result<ModuleLink>>;
    putModules(params: ImportedRecords | SingleRecord): Promise<Result<ModuleLink[]>>;
    get untrackedModuleAmount(): number;
    get moduleCategories(): string[];
    isSupportedModuleCategory(moduleCategory: string): boolean;
    beforeGet(_selector: string, rest: Rest<ReflectElementType>, _data?: ReflectElementType): Promise<OkResult>;
    beforePut(_selector: string, rest: Rest<ReflectElementType>, _data?: ReflectElementType): Promise<OkResult>;
    beforeDelete(_selector: string, rest: Rest<ReflectElementType>, _data?: ReflectElementType): Promise<OkResult>;
    beforePatch<AttrType>(_selector: string, rest: Rest<ReflectElementType>, _data?: AttrType): Promise<OkResult>;
    beforePost(_selector: string, rest: Rest<ReflectElementType>, data?: ReflectElementType): Promise<OkResult>;
    afterPost(_selector: string, _rest: Rest<ReflectElementType>, data?: ReflectElementType): Promise<OkResult>;
    private beforeAny;
    private postNodeJSContents;
    private postBuiltInIdentifiers;
}
