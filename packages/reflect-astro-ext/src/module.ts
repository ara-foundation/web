import type { AstroInstance } from "astro";
import { parse as AstroParse } from "@astrojs/compiler";
import type { RootNode } from "@astrojs/compiler/types";
import { 
    getFileExtension, 
    ModuleCategory as BaseCategory, 
    FileExtension as BaseExtension,
    getFileContent 
} from "@ara-web/reflect/module";
import { ModuleMemory } from "@ara-web/reflect/memory";
import { Debug, enumValues, Result, type Page } from "@ara-web/ts-enhancement";
import type { AstroNode } from "./component.js";

/**
 * Module Category to sort the modules.
 * By design module categories supposed to match the directory in the file system.
 * Although it's not required.
 */
export enum ModuleCategory {
    Script = "scripts",
    Component = "components",
    Page = "pages",
    Layout = "layouts"
}

/**
 * List of file extensions Astro Framework Reflection could reflect.
 */
export enum FileExtension {
    Astro = ".astro",
    Tsx = BaseExtension.Tsx,
    Jsx = BaseExtension.Jsx,
    Typescript = BaseExtension.Typescript,
    Javascript = BaseExtension.Javascript,
}

/**
 * Any UI Content is composed of the HTML Elements and the source code
 */
export type ModuleParts = {
    fileExtension: FileExtension,
    elements?: AstroNode[],             // Change to the generic to support react.
    source?: string,
}

/**
 * Identify the path as path to a script, component, or a page?
 * @param {string} path the file path 
 * @returns {ModuleCategory}
 */
export const identifyModuleType = (path: string): ModuleCategory|BaseCategory => {
    // path = trimPath(path);
    if (path.indexOf(ModuleCategory.Layout) > -1) {
        return ModuleCategory.Layout;
    }

    if (path.indexOf(ModuleCategory.Script) > -1) {
        return ModuleCategory.Script;
    } 
    if (path.indexOf(ModuleCategory.Component) > -1) {
        return ModuleCategory.Component;
    } 
    if (path.indexOf(ModuleCategory.Page) > -1) {
        return ModuleCategory.Page;
    }

    return BaseCategory.Untracked;
}


/**
 * The modulePath that usually seen in the `import {} from 'module-path'` clause.
 * This function returns all possible ways how this modulePath is
 * written as the file in the ProjectMemory.
 * 
 * For example: import type {MyType} from "@scripts/libs"
 * Returns:
 *  - src/scripts/lib.ts
 *  - src/scripts/lib.tsx
 *  - src/scripts/lib.jsx
 *  - src/scripts/lib.js
 *  - src/scripts/lib.astro
 *  - src/scripts/lib/index.js
 *  - src/scripts/lib/index.ts
 *  - src/scripts/lib/index.astro
 *  - src/scripts/lib/index.tsx
 *  - src/scripts/lib/index.jsx
 * @param modulePath
 */
export const modulePathToAllPossibleFileNames = (modulePath: string, fileExtension?: FileExtension.Typescript): string[] => {
    const identifiedFileExtension = getFileExtension(modulePath, enumValues(FileExtension));
    if (identifiedFileExtension.isSuccess) {
        return [modulePath];
    }
    
    if (fileExtension !== undefined) {
        return [modulePath + fileExtension];
    }

    let urls: string[] = enumValues(FileExtension).filter((fileExtension) => (modulePath + fileExtension));

    if (!modulePath.endsWith("index") && !modulePath.endsWith("index/")) {
        let index: string;
        if (modulePath.endsWith("/")) {
            index = "index"
        } else {
            index = "/index"
        }
        urls = [...urls, ...enumValues(FileExtension).filter((fileExtension) => (modulePath + index + fileExtension))]
    }

    return urls;
}

// /**
//  * Converts the file name into a Url within the Ara Web
//  * @param fileName a page
//  */
// export const fileNameToUrl = (fileName: string): string => {
//     let index = fileName.indexOf("/index.astro");
//     if (index > -1) {
//         return fileName.substring(0, index)
//     }

//     return fileName.substring(0, fileName.indexOf(".astro"));
// }

/**
 * Reflect is the main source to Reflect on the website itself.
 */
export class ModulePartitioner {
    private constructor() {}
    
    /**
     * Identifies the parts that the module has. Additionally, it also identifies the source code
     * @returns {Result<Page[]>}
     */
    public static partition = async <T>(moduleMemory: ModuleMemory<T>): Promise<Result<ModuleParts>> => {
        const uiContent = await this.getModuleParts(moduleMemory);
        if (uiContent.isFailure) {
            return Result.fail(
                `this.getModuleParts(): ${uiContent.errorTitle}`,
                uiContent.errorDescription!
            )
        }

        return Result.ok(uiContent.getValue())
    }

    /**
     * Returns a page by it's path
     */
    getPageByUrl = async(url: string | undefined): Promise<Page|undefined> => {
        if (url === undefined) {
            return undefined;
        }
        if (url.length === 0) {
            return undefined;
        }
        if (url[url.length - 1] === "/") {
            url = url.substring(0, url.length - 1);
        }

        // const pages = await this.getPages();

        // if (pages.isFailure) {
        //     return undefined;
        // }

        // for (const page of pages.getValue()) {
        //     const pageUrl = fileNameToUrl(page.fileName);
        //     if (url === pageUrl) {
        //         return page;
        //     }
        // }

        return undefined;
    }

    //************************************************************** */
    //
    // Private methods of the pages
    //
    //************************************************************** */

    
    
    private static getAstroFilePath = (glob: unknown): string => {
        // Astro framework adds the absolute file paths.
        return (glob as AstroInstance).file;
    }

    /**
     * Loads the module and returns the module parts such as which HTML elements it contains and source code.
     * @param modulePath The module path is used to define the absolute path to the file
     * @param glob 
     * @returns 
     */
    private static getModuleParts = async <T>(moduleMemory: ModuleMemory<T>): Promise<Result<ModuleParts>> => {
        // const absoluteModulePath = absolutePath(modulePath, glob);
        const fileExtensionResult = getFileExtension(moduleMemory.moduleLink.modulePath, enumValues(FileExtension));
        if (fileExtensionResult.isFailure) {
            return Result.fail(
                `getFileExtension('${moduleMemory.moduleLink.modulePath}'): ${fileExtensionResult.errorTitle}`,
                fileExtensionResult.errorDescription!
            )
        }
        const fileExtension = fileExtensionResult.getValue() as FileExtension;    
        if (fileExtension !== FileExtension.Astro) {
            return Result.ok({fileExtension});
        }       

        const absolutePath = this.getAstroFilePath(moduleMemory.glob);
        // For now we omit fetching anything but Astro.
        //     const absolutePath = fileExtension === FileExtension.Astro ?
        //         this.getAstroFilePath(moduleMemory.glob) : 
        //         `/${moduleMemory.moduleLink.modulePath!}`;
        const readResult = await getFileContent(absolutePath);
        if (readResult.isFailure) {
            return Result.fail(`getFileContent(${absolutePath}): ${readResult.errorTitle}`, readResult.errorDescription!)
        }
        const source = readResult.getValue();

        //     if (fileExtension !== FileExtension.Astro) {
        //         return Result.ok({fileExtension, elements: [], source})
        //     }

        const fileContent: ModuleParts = await this.parseAstroFile(source);
        return Result.ok(fileContent);
    }

    /**
     * Sets the code and nodes properties of the file content if it's an Astro file
     * @param astroSource through the file system we read the content of the file
     * @returns {Promise<ModuleParts>} fileContent with the `nodes` and `code` properties set
     */
    private static parseAstroFile = async (astroSource: string): Promise<ModuleParts> => {
        const result = await AstroParse(astroSource, {
            position: false, // defaults to `true`
        });

        const {frontmatterCode, componentNodes} = this.extractAstroComponents(result.ast);

        const fileContent: ModuleParts = {
            source: frontmatterCode.length > 0 ? frontmatterCode : undefined,
            elements: componentNodes.length > 0 ? componentNodes : undefined,
            fileExtension: FileExtension.Astro,
        }

        return fileContent;
    }

    /**
     * Parses the Astro web page into the components and its frontmatter code.
     * 
     * Supports:
     *  - Component
     *  - Element types.
     * The pure text components in the web pages are not considered.
     * @todo make sure to parse the components to the respected areas
     * @param ast A RootNode of the Astro Web Page
     * @returns Components and Frontmatter
     */
    private static extractAstroComponents = (ast: RootNode): {componentNodes: AstroNode[], frontmatterCode: string} => {
        const componentNodes: AstroNode[] = [];
        let frontmatterCode: string = "";

        for (let i = 0; i < ast.children.length; i++) {
            const child = ast.children[i];
            if (child.type === "text") {
                continue;
            }

            if (child.type === "frontmatter") {
                frontmatterCode = child.value;
            }
            else if (child.type === "component") {
                componentNodes.push(child)
            } else if (child.type === "element") {
                componentNodes.push(child);
            } else if (child.type === "doctype") {
                Debug.log(`The page has '${child.type}' that set the resource to '${child.value}'`)
            } else {
                Debug.log(`The page has unsupported ${child.type} node, Update the MultiPartitioner.extractAstroComponents():`)
                Debug.log(child)
            }
        }

        return {componentNodes, frontmatterCode};
    }
}