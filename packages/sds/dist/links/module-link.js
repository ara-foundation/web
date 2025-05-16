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
import PathModule from "node:path";
import { PackageURL } from "packageurl-js";
import { fileURLToPath, pathToFileURL } from "url";
import { Result } from "@ara-web/p-hintjens";
const version = undefined;
/**
 * ModuleLink
 */
export class ModuleLink {
    _internal;
    constructor() { }
    static newPackageURL(namespace, name, absolutePath, subpath, schema = "npm") {
        const moduleLink = new ModuleLink();
        const qualifier = absolutePath === undefined ? undefined : { absolutePath: absolutePath.moduleURL };
        moduleLink._internal = new PackageURL(schema, namespace, name, version, qualifier, subpath);
        return moduleLink;
    }
    static newPackageURLWithQualifiers(namespace, name, qualifiers, subPath, schema = "npm") {
        const moduleLink = new ModuleLink();
        moduleLink._internal = new PackageURL(schema, namespace, name, version, qualifiers, subPath);
        return moduleLink;
    }
    static newFileURL(filePath) {
        const moduleLink = new ModuleLink();
        moduleLink._internal =
            typeof filePath === "string" ?
                pathToFileURL(filePath, { windows: false }) :
                moduleLink._internal = filePath;
        return moduleLink;
    }
    get moduleURL() {
        return this._internal.toString();
    }
    toString() {
        return this.moduleURL;
    }
    get isPkgURL() {
        return this.moduleURL.startsWith("pkg:");
    }
    get isFileURL() {
        return this.moduleURL.startsWith("file://");
    }
    isEqual(moduleURL) {
        if (typeof moduleURL === "string") {
            return this.moduleURL === moduleURL;
        }
        return this.moduleURL === moduleURL.moduleURL;
    }
    /**
     * Returns the file path to use with the `node:fs`.
     */
    get toFilePath() {
        if (this.isPkgURL) {
            const packageURL = this._internal;
            if (packageURL.qualifiers === undefined || packageURL.qualifiers["absolutePath"] === undefined) {
                return `${packageURL.namespace !== undefined ? packageURL.namespace + '/' : ''}${packageURL.name}`;
            }
        }
        return fileURLToPath(this.moduleURL);
    }
    get toPkgURL() {
        return this._internal;
    }
    static fromModuleURL(moduleURL) {
        if (moduleURL.startsWith('pkg:')) {
            try {
                const packageURL = PackageURL.fromString(moduleURL);
                if (packageURL.qualifiers === undefined || packageURL.qualifiers["absolutePath"] === undefined) {
                    return Result.fail(`The ModuleURL doesnt have the qualifiers that points to the local file of the module`, `Please update the '${moduleURL}' to add the file by passing 'absolutePath' qualifier`);
                }
                return Result.ok(ModuleLink.newPackageURL(packageURL.namespace, packageURL.name, ModuleLink.newFileURL(packageURL.qualifiers["absolutePath"]), packageURL.subpath));
            }
            catch (e) {
                return Result.fail(`Invalid url '${moduleURL}'`, e.message);
            }
        }
        else if (moduleURL.startsWith('file://')) {
            return Result.ok(ModuleLink.newFileURL(moduleURL));
        }
        return Result.fail(`Unsupported module URL, the schema is unsupported by ModuleLink`);
    }
    /**
     * Converts the import clauses, such as the last quoted string in `import {data} from 'import clause'`
     * to the package url. Optionally, pass the absolute path as the package urls qualifier.
     * @param importClause
     * @param absPath
     * @returns {ModuleLink} A PackageURL from the import clause
     */
    static newPackageURLFromImportClause = (importClause, absPath) => {
        let [possibleNamespaceOrName, name, ...subDirs] = importClause.split(PathModule.sep);
        const subPath = subDirs.length === 0 ? undefined : subDirs.join(PathModule.sep);
        name = name === undefined || name.length === 0 ? possibleNamespaceOrName : name;
        const namespace = possibleNamespaceOrName === name ? undefined : possibleNamespaceOrName;
        const moduleLink = ModuleLink.newPackageURL(namespace, name, absPath, subPath);
        return moduleLink;
    };
}
