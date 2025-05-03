import type { RootNode } from "@astrojs/compiler/types";
import { parse as AstroParse } from "@astrojs/compiler";
import { Debug, Result, EnumTraits, ObjectTraits } from "@ara-web/p-hintjens";
import { FilePath, ModuleMemory } from "@ara-web/reflect";
import { 
    FileExtension, 
    type Component, 
    type ModuleParts, 
    type OntologoicalIdentifier, 
    ElementType, 
    type Module, 
    type Asset 
} from "./ontology/index.js";
import { AstroNode } from "./astro-node.js";
import { CodeLevel } from "./code-level/index.js";

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
    for (const moduleCategory of EnumTraits.enumValues(ModuleCategory)) {
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
     * @returns {Result<ModuleParts>}
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
    getPageByUrl = async(url: string | undefined): Promise<Component|undefined> => {
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
    
    /**
     * Loads the module and returns the module parts such as which HTML elements it contains and source code.
     * 
     * @param modulePath The module path is used to define the absolute path to the file
     * @param glob 
     * @returns 
     */
    private static getModuleParts = async <T>(moduleMemory: ModuleMemory<T>): Promise<Result<ModuleParts>> => {
        const fileExtensionResult = FilePath.getFileExtension(moduleMemory.moduleLink.toFilePath, EnumTraits.enumValues(FileExtension));
        if (fileExtensionResult.isFailure) {
            return Result.fail(
                `getFileExtension('${moduleMemory.moduleLink.toFilePath}'): ${fileExtensionResult.errorTitle}`,
                fileExtensionResult.errorDescription!
            )
        }
        const fileExtension = fileExtensionResult.getValue() as FileExtension;    

        const absolutePath = moduleMemory.moduleLink.toFilePath;
        const readResult = FilePath.getFileContent(absolutePath);
        if (readResult.isFailure) {
            return Result.fail(`getFileContent(${absolutePath}): ${readResult.errorTitle}`, readResult.errorDescription!)
        }
        const source = readResult.getValue();

        // If we start to support the TSX or JSX
        if (fileExtension !== FileExtension.Astro) {
            return Result.ok({fileExtension, elements: [], source: `${source}`})
        }

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
            source: frontmatterCode.length > 0 ? frontmatterCode : '',
            elements: componentNodes.length > 0 ? componentNodes : [],
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
     * @param ast A RootNode of the Astro Web Page
     * @returns Components and Frontmatter
     */
    private static extractAstroComponents = (ast: RootNode): {componentNodes: AstroNode[], frontmatterCode: string} => {
        const componentNodes: AstroNode[] = [];
        let frontmatterCode: string = "";

        for (let i = 0; i < ast.children.length; i++) {
            const child = ast.children[i];
            if (child.type === "comment" || child.type === "doctype") {
                continue;
            }
            if (child.type === "frontmatter") {
                frontmatterCode = child.value;
            } else if (!AstroNode.isSupportedNode(child)) {
                Debug.log(`The page has unsupported ${child.type} node, Update the MultiPartitioner.extractAstroComponents():`)
                Debug.log(child)
            } else {
                const astroNode = AstroNode.newFromNode(child);
                if (astroNode.isFailure) {
                    Debug.error(`AstroNode.newFromNode(): ${astroNode.errorTitle}`, astroNode.errorDescription!, child);
                } else {
                    componentNodes.push(astroNode.getValue());
                }
            }
        }

        return {componentNodes, frontmatterCode};
    }
}

/**
 * If Module is Script or Asset, basically anything that is not UI Level, but also
 * doesn't require identifying code structure, therefore not in Code Level too.
 * 
 * Ontologically, `ModuleIdentifier` supports translation of modules into `Script` and `Asset` data
 */
@ObjectTraits.staticImplements<OntologoicalIdentifier>()
export class ModuleIdentifier {
    /**
     * Checks is the following a script, which are the files that ends with TS and JS.
     * @param fileExtension 
     */
    public static isScript = (fileExtension: FileExtension): boolean => {
        return ([
            FileExtension.Javascript, 
            FileExtension.Typescript,
        ]).includes(fileExtension);
    }

    public static isAsset = (fileExtension: FileExtension): boolean => {
        return (fileExtension !== FileExtension.Astro && !this.isScript(fileExtension));
    }

    /**
     * Converts the module `parts` and module `rawMemory` into `Script` or `Asset`.
     * Detects the identification by the module link.
     * @param parts 
     * @param rawMemory 
     * @returns 
     */
    public static identify = async <T>(parts: ModuleParts, rawMemory: ModuleMemory<T>): Promise<Result<T>> => {
        const filePath = rawMemory.moduleLink.toFilePath;
        const fileExtensionResult = FilePath.getFileExtension(filePath, EnumTraits.enumValues(FileExtension));
        if (fileExtensionResult.isFailure) {
            return Result.fail(
                `FilePath.getFileExtension('${filePath}, [${EnumTraits.enumValues(FileExtension).join(", ")}]): ${fileExtensionResult.errorTitle}`,
                fileExtensionResult.errorDescription!
            )
        }

        const fileExtension = fileExtensionResult.getValue() as FileExtension;
        const title = await FilePath.getFileName(filePath);
        if (title.isFailure) {
            return Result.fail(`FilePath.getFileName('${filePath}'): ${title.errorTitle}`, title.errorDescription!)
        }
        const { description } = CodeLevel.identifyMeta(parts.source!);

        if (this.isScript(fileExtension)) {
            const data: Module = {
                title: title.getValue(),
                description,
                moduleLink: rawMemory.moduleLink,
                fileExtension: fileExtension,
                get: rawMemory.glob,
                type: ElementType.Script,
                source: parts.source!,             // Source code of the script as it is.
            }
            return Result.ok(data as T);
        } else if (this.isAsset(fileExtension)) {
            const data: Asset = {
                title: title.getValue(),
                description,
                moduleLink: rawMemory.moduleLink,
                fileExtension: fileExtension,
                get: rawMemory.glob,
                type: ElementType.Asset,
                source: parts.source ? parts.source : undefined,
            }
            return Result.ok(data as T);
        }

        return Result.errorCode404(['module', 'Module Identifier'], 'identify', `The '${filePath}' file extension is neither for assets nor for scripts`);
    }

}