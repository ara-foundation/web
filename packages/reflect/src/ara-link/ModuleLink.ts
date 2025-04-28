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
import { PackageURL } from "packageurl-js";
import { fileURLToPath, pathToFileURL } from "url";

export type ModuleURL = `pkg:npm${string}` | `file://${string}`;

const version = undefined;

/**
 * ModuleLink
 */
export class ModuleLink {
    private _internal?: URL | PackageURL;

    private constructor() {}

    public static newPackageURL(namespace: string | undefined, name: string, absolutePath: ModuleLink, subpath?: string): ModuleLink {
        const moduleLink = new ModuleLink();
        moduleLink._internal = new PackageURL("npm", namespace, name, version, {absolutePath: absolutePath.moduleURL}, subpath);
        return moduleLink;
    }

    public static newFileURL(filePath: string | URL): ModuleLink {
        const moduleLink = new ModuleLink();
        moduleLink._internal = 
            typeof filePath === "string" ? 
                pathToFileURL(filePath, {windows: false}):
                moduleLink._internal = filePath as URL;
        return moduleLink;
    }

    public get moduleURL(): ModuleURL {
        return this._internal!.toString() as ModuleURL;
    }

    public toString(): string {
        return this.moduleURL as string;
    }

    public get isPkgURL(): boolean {
        return this.moduleURL.startsWith("pkg:")
    }

    public get isFileURL(): boolean {
        return this.moduleURL.startsWith("file://")
    }

    public isEqual(moduleURL: ModuleURL | ModuleLink): boolean {
        if (typeof moduleURL === "string") {
            return this.moduleURL === moduleURL;
        }
        return this.moduleURL === moduleURL.moduleURL;
    }

    /**
     * Returns the file path to use with the `node:fs`.
     */
    public get toFilePath(): string {
        if (this.isPkgURL) {
            const packageURL = this._internal as PackageURL;
            if (packageURL.qualifiers === undefined || packageURL.qualifiers["absolutePath"] === undefined) {
                return `${packageURL.namespace !== undefined ? packageURL.namespace + '/' : ''}${packageURL.name}`;
            }
        }
        return fileURLToPath(this.moduleURL);
    }

    public static fromModuleURL(moduleURL: ModuleURL): Result<ModuleLink> {
        if (moduleURL.startsWith('pkg:')) {
            try {
                const packageURL = PackageURL.fromString(moduleURL)
                if (packageURL.qualifiers === undefined || packageURL.qualifiers["absolutePath"] === undefined) {
                    return Result.fail(
                        `The ModuleURL doesnt have the qualifiers that points to the local file of the module`,
                        `Please update the '${moduleURL}' to add the file by passing 'absolutePath' qualifier`
                    );
                }
                return Result.ok(ModuleLink.newPackageURL(
                    packageURL.namespace, 
                    packageURL.name, 
                    ModuleLink.newFileURL(packageURL.qualifiers["absolutePath"]),
                    packageURL.subpath
                ));
            } catch (e) {
                return Result.fail(`Invalid url '${moduleURL}'`, (e as any).message)
            }
        } else if (moduleURL.startsWith('file://')) {
            return Result.ok(ModuleLink.newFileURL(moduleURL));
        }

        return Result.fail(`Unsupported module URL, the schema is unsupported by ModuleLink`)
    }
}

