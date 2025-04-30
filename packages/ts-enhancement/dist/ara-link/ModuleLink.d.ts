import { Result } from "../index.js";
export type ModuleURL = `pkg:npm${string}` | `file://${string}`;
/**
 * ModuleLink
 */
export declare class ModuleLink {
    private _internal?;
    private constructor();
    static newPackageURL(namespace: string | undefined, name: string, absolutePath?: ModuleLink, subpath?: string): ModuleLink;
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
    /**
     * Converts the import clauses, such as the last quoted string in `import {data} from 'import clause'`
     * to the package url. Optionally, pass the absolute path as the package urls qualifier.
     * @param importClause
     * @param absPath
     * @returns {ModuleLink} A PackageURL from the import clause
     */
    static fromImportClause: (importClause: string, absPath?: ModuleLink) => ModuleLink;
}
