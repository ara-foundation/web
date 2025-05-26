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
import PathModule from "node:path"
import { PackageURL, type PurlQualifiers } from "packageurl-js";
import { fileURLToPath, pathToFileURL } from "url";
import { Result } from "@ara-web/p-hintjens";

export type ModuleURL = `pkg:${string}` | `file://${string}`;

const version = undefined;

/**
 * ModuleLink
 */
export class ModuleLink {
    private _internal?: URL | PackageURL;

    protected constructor() {}

    /**
     * Create a new package url:
     * 
     * Example:
     * 
     * ```typescript
     * ModuleLink.newPackageLink(`@ara-web`, `sds`, `links/module-link.ts`, {absolutePath: import.meta.filename});
     * ```
     * 
     * @param namespace 
     * @param name 
     * @param subpath 
     * @param qualifiers 
     * @param schema 
     * @returns 
     */
    public static newPackageLink(
        namespace: string | undefined, 
        name: string, 
        subpath?: string, 
        qualifiers?: PurlQualifiers, 
        schema: string = "npm"
    ): ModuleLink {
        const moduleLink = new ModuleLink();
        moduleLink._internal = new PackageURL(schema, namespace, name, version, qualifiers, subpath);
        return moduleLink;
    }

    /**
     * Create a module link from the file path.
     * The module link for the files are `file://` protocol supported
     * by all browsers and OS explorers.
     * @param filePath 
     * @returns 
     */
    public static newFileLink(filePath: string | URL): ModuleLink {
        const moduleLink = new ModuleLink();
        moduleLink._internal = 
            typeof filePath === "string" ? 
                pathToFileURL(filePath, {windows: false}):
                moduleLink._internal = filePath as URL;
        return moduleLink;
    }

    public get url(): ModuleURL {
        return this._internal!.toString() as ModuleURL;
    }

    public getAttribute(attrName: string): string|undefined {
        if (this.isPkgURL) {
            const pkgUrl = this._internal as PackageURL;
            if (pkgUrl.qualifiers !== undefined && pkgUrl.qualifiers[attrName]) {
                return pkgUrl.qualifiers[attrName];
            }
        }
        return undefined;
    }

    public toString(): string {
        return this.url as string;
    }

    public get isPkgURL(): boolean {
        return this.url.startsWith("pkg:")
    }

    public get isFileURL(): boolean {
        return this.url.startsWith("file://")
    }

    public isEqual(moduleURL: ModuleURL | ModuleLink): boolean {
        if (typeof moduleURL === "string") {
            return this.url === moduleURL;
        }
        return this.url === moduleURL.url;
    }

    /**
     * Returns the file path to use with the `node:fs`.
     * If the module link is the PackageURL, then the package url must
     * have the `absolutePath` argument that will be returned as the file path.
     */
    public get toAbsFilePath(): string {
        if (this.isPkgURL) {
            const packageURL = this._internal as PackageURL;
            if (packageURL.qualifiers === undefined || packageURL.qualifiers["absolutePath"] === undefined) {
                return `${packageURL.namespace !== undefined ? packageURL.namespace + '/' : ''}${packageURL.name}`;
            }
        }
        return fileURLToPath(this.url);
    }

    public get toPackageURL(): PackageURL {
        return this._internal as PackageURL;
    }

    public static fromModuleURL(moduleURL: ModuleURL, pkgQualifiers?: PurlQualifiers): Result<ModuleLink> {
        if (moduleURL.startsWith('pkg:')) {
            try {
                const packageURL = PackageURL.fromString(moduleURL)
                if (pkgQualifiers === undefined) {
                    pkgQualifiers = packageURL.qualifiers
                } else if (packageURL.qualifiers !== undefined) {
                    pkgQualifiers = {...packageURL.qualifiers, ...pkgQualifiers};
                }

                return Result.ok(ModuleLink.newPackageLink(
                    packageURL.namespace, 
                    packageURL.name, 
                    packageURL.subpath,
                    pkgQualifiers
                ));
            } catch (e) {
                return Result.fail(`Invalid url '${moduleURL}'`, (e as any).message)
            }
        } else if (moduleURL.startsWith('file://')) {
            return Result.ok(ModuleLink.newFileLink(moduleURL));
        }

        return Result.fail(`Unsupported module URL, the schema is unsupported by ModuleLink`)
    }

    /**
     * Converts the import clauses, such as the last quoted string in `import {data} from 'import clause'`
     * to the package url. Optionally, pass the absolute path as the package urls qualifier.
     * @param importClause 
     * @param absPath 
     * @returns {ModuleLink} A PackageURL from the import clause
     */
    public static newPackageURLFromImportClause = (importClause: string, absPath?: ModuleLink): ModuleLink => {
        let [possibleNamespaceOrName, name, ...subDirs] = importClause.split(PathModule.sep);

        const subPath = subDirs.length === 0 ? undefined : subDirs.join(PathModule.sep);
        name = name === undefined || name.length === 0 ? possibleNamespaceOrName : name;
        const namespace = possibleNamespaceOrName === name ? undefined : possibleNamespaceOrName;
        
        let qualifiers: PurlQualifiers = {};
        if (absPath !== undefined) {
            qualifiers = {absolutePath: absPath.url};
        }

        const moduleLink = ModuleLink.newPackageLink(namespace, name, subPath, qualifiers);
        return moduleLink;
    }

}
