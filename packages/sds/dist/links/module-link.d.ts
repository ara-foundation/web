import { PackageURL, type PurlQualifiers } from "packageurl-js";
import { Result } from "@ara-web/p-hintjens";
export type ModuleURL = `pkg:${string}` | `file://${string}`;
/**
 * ModuleLink
 */
export declare class ModuleLink {
    private _internal?;
    protected constructor();
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
    static newPackageLink(namespace: string | undefined, name: string, subpath?: string, qualifiers?: PurlQualifiers, schema?: string): ModuleLink;
    /**
     * Create a module link from the file path.
     * The module link for the files are `file://` protocol supported
     * by all browsers and OS explorers.
     * @param filePath
     * @returns
     */
    static newFileLink(filePath: string | URL): ModuleLink;
    get url(): ModuleURL;
    getAttribute(attrName: string): string | undefined;
    toString(): string;
    get isPkgURL(): boolean;
    get isFileURL(): boolean;
    isEqual(moduleURL: ModuleURL | ModuleLink): boolean;
    /**
     * Returns the file path to use with the `node:fs`.
     * If the module link is the PackageURL, then the package url must
     * have the `absolutePath` argument that will be returned as the file path.
     */
    get toAbsFilePath(): string;
    get toPackageURL(): PackageURL;
    static fromModuleURL(moduleURL: ModuleURL, pkgQualifiers?: PurlQualifiers): Result<ModuleLink>;
    /**
     * Converts the import clauses, such as the last quoted string in `import {data} from 'import clause'`
     * to the package url. Optionally, pass the absolute path as the package urls qualifier.
     * @param importClause
     * @param absPath
     * @returns {ModuleLink} A PackageURL from the import clause
     */
    static newPackageURLFromImportClause: (importClause: string, absPath?: ModuleLink) => ModuleLink;
}
