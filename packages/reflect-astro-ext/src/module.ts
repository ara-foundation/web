import type { AstroInstance } from "astro";
import { parse as AstroParse } from "@astrojs/compiler";
import type { RootNode } from "@astrojs/compiler/types";
import { 
    FileExtension as BaseExtension,
    FilePath
} from "@ara-web/reflect/module";
import { ModuleMemory } from "@ara-web/reflect/memory";
import { Debug, enumValues, Result, type AraPage } from "@ara-web/ts-enhancement";
import type { AstroNode } from "./component.js";
import type { ModuleLink } from "@ara-web/reflect/module-link";

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
    Svg = ".svg",
    Markdown = ".md",
    Tsx = ".tsx",
    Jsx = ".jsx",
    Typescript = BaseExtension.Typescript,
    Javascript = BaseExtension.Javascript,
}

/**
 * Any UI Content is composed of the HTML Elements and the source code
 */
export type ModuleParts = {
    moduleLink: ModuleLink,
    fileExtension: FileExtension,
    elements?: AstroNode[],             // Change to the generic to support react.
    source?: string,
}

/**
 * Detects the module category. To detct, it must be in the src.
 * @param modulePath 
 * @returns 
 */
export const extractModuleCategory = (srcDir: string, modulePath: string): Result<ModuleCategory|string> => {
    if (!modulePath.startsWith(srcDir)) {
        return Result.fail(
            `The Astro Framework records must be in the 'src' of the root directory`, 
            `Please pass a module in '${srcDir}', not as '${modulePath}'`
        )
    }

    // Could be one of the pre-defined categories such as 'pages', 'components' etc.
    for (let moduleCategory of enumValues(ModuleCategory)) {
        if (modulePath.startsWith(FilePath.join([srcDir, moduleCategory]))) {
            return Result.ok(moduleCategory as ModuleCategory);
        }
    }

    // User-made category
    const moduleSlugs = modulePath.substring(srcDir.length).split("/");
    if (moduleSlugs.length < 2) {
        return Result.fail(`The '${modulePath}' doesn't have a category`, `Are you sure its in the sub-directory of the src/?`)
    }

    return Result.ok(moduleSlugs[0])
}

/**
 * Partition the Module into the UI elements and the source code
 */
export class ModulePartitioner {
    private constructor() {}
    
    /**
     * Identifies the parts that the module has. Additionally, it also identifies the source code
     * @returns {Result<AraPage[]>}
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
    getPageByUrl = async(url: string | undefined): Promise<AraPage|undefined> => {
        if (url === undefined) {
            return undefined;
        }
        if (url.length === 0) {
            return undefined;
        }
        if (url[url.length - 1] === "/") {
            url = url.substring(0, url.length - 1);
        }

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
        const fileExtensionResult = FilePath.getFileExtension(moduleMemory.moduleLink.toFilePath, enumValues(FileExtension));
        if (fileExtensionResult.isFailure) {
            return Result.fail(
                `getFileExtension('${moduleMemory.moduleLink.toFilePath}'): ${fileExtensionResult.errorTitle}`,
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
        const readResult = await FilePath.getFileContent(absolutePath);
        if (readResult.isFailure) {
            return Result.fail(`getFileContent(${absolutePath}): ${readResult.errorTitle}`, readResult.errorDescription!)
        }
        const source = readResult.getValue();

        // If we start to support the TSX or JSX
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