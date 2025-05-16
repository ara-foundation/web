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

    public static newPackageURL(namespace: string | undefined, name: string, absolutePath?: ModuleLink, subpath?: string, schema: string = "npm"): ModuleLink {
        const moduleLink = new ModuleLink();
        const qualifier = absolutePath === undefined ? undefined : {absolutePath: absolutePath.moduleURL};
        moduleLink._internal = new PackageURL(schema, namespace, name, version, qualifier, subpath);
        return moduleLink;
    }

    public static newPackageURLWithQualifiers(namespace: string, name: string, qualifiers: PurlQualifiers, subPath?: string, schema: string = "npm"): ModuleLink {
        const moduleLink = new ModuleLink();
        moduleLink._internal = new PackageURL(schema, namespace, name, version, qualifiers, subPath);
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

    public get toPkgURL(): PackageURL {
        return this._internal as PackageURL;
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
            
        const moduleLink = ModuleLink.newPackageURL(namespace, name, absPath, subPath);
        return moduleLink;
    }

}
