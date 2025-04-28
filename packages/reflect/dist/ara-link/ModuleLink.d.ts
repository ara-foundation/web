/**
 * Built in NodeJS Modules:
    pkg:npm/<module as it is>

    We pass the file name as the sub-path
    pkg:npm/@ara-web/reflect-astro-ext?category=layouts#/src/layouts/AraWebLayout.astro

    The Identifiers (schema: reflect, type: code, namespace: id, value: name)
    pkg:reflect/id/name?properties#
    The Expression or a node
    reflect:code/exp/{name}?properties?purl=pkg:npm/@ara-web/reflect-astro-ext?category=layouts#/src/layouts/AraWebLayout.astro

    Each Extension has few methods that converts file path to the ara link and reverse.
    To support it, the file names shall not have the ./ or ../
    filePathToAraLink = (moduleCategory, filePath): AraLink
    araLinkToModulePaths = (AraLink): string[]
    modulePathToAraLinks = (modulePath): AraLink[]

 */
import { Result } from "@ara-web/ts-enhancement";
export type ModuleURL = `pkg:npm${string}` | `file://${string}`;
/**
 * ModuleLink
 */
export declare class ModuleLink {
    private _internal?;
    private constructor();
    static newPackageURL(namespace: string | undefined, name: string, absolutePath: ModuleLink, subpath?: string): ModuleLink;
    static newFileURL(filePath: string | URL): ModuleLink;
    get moduleURL(): ModuleURL;
    toString(): string;
    get isPkgURL(): boolean;
    get isFileURL(): boolean;
    isEqual(moduleURL: ModuleURL | ModuleLink): boolean;
    /**
     * Returns the file path to use with the `node:fs`.
     */
    get toFilePath(): string;
    static fromModuleURL(moduleURL: ModuleURL): Result<ModuleLink>;
}
