/**
 * Coder is the module that parses the files.
 * And returns the Components along with the AST
 */
import { parse as AstroParse, transform, type TransformResult } from "@astrojs/compiler";
import type { ComponentNode, ElementNode, RootNode } from "@astrojs/compiler/types";
import { readFile } from "node:fs/promises"
import { parse as commentParse} from "comment-parser";
import { JSDoc, Project, StringLiteral, SyntaxList } from "ts-morph";
import type { MarkdownInstance, AstroInstance } from 'astro';
import PathModule from "node:path"
import { identifyModuleType, ModuleType, trimPath } from "@scripts/reflect/module";
import { getScriptByPath } from "@scripts/reflect/script";

export enum PathType {
    Astro = ".astro",
    Tsx = ".tsx",
    Jsx = ".jsx",
    Typescript = ".ts",
    Javascript = ".js",
    DirectoryOrUndefined = "",
}

export type NodeType = ComponentNode | ElementNode;

/**
 * The content of any page will contain list of the nodes and code, usually a frontmatter.
 */
export type FileContent = {
    nodes?: NodeType[], 
    source?: string,
    type: PathType,
    filePath: string,
    error?: string,
    glob?: unknown,
}

/**
 * Detects the file type by the file extension, if not supported file then return PathType.DirectoryOrUndefined.
 * @param filePath the full path to the file within the Ara Web
 * @returns {PathType}
 */
const detectPathType = (filePath: string): PathType => {
    const extensionIndex = filePath.lastIndexOf(".");
    if (extensionIndex === -1) {
        return PathType.DirectoryOrUndefined;
    }

    const extension = filePath.substring(extensionIndex);

    const pathTypes = Object.keys(PathType)
    for (const pathType of pathTypes) {
        const key = pathType as keyof typeof PathType;
        if (PathType[key] === extension) {
            return PathType[key];
        }
    }

    return PathType.DirectoryOrUndefined;
}

const astProject = new Project({
    useInMemoryFileSystem: true
})

/** 
 * For Pages: There are Markdown (.md extension) files that we won't count.
 * There are other pages that we won't count for now.
 * For example: 
 * @example Get the pages parseGlob<Page>(`../pages/ara/`, eager: true);
 * @todo To identify the RPCs by components, use a special Typescript parser
 * For now we rely on the component names
 * @param globs
*/
export const globsToFileContents = async(globs: Record<string, () => Promise<unknown>> | Record<string, unknown>): Promise<FileContent[]> => {
    let contents: FileContent[] = [];

    for (let glob in globs) {
        let filePath = (globs[glob] as AstroInstance).file as string;
        if (filePath === undefined) {
            filePath = process.cwd() + PathModule.resolve(glob);
        }
        const fileContent: FileContent = {
            filePath,
            type: detectPathType(filePath),
            glob: globs[glob],
        }

        if (fileContent.type === PathType.DirectoryOrUndefined) {
            fileContent.error = "Filepath is not supported by Ara Web"
            contents.push(fileContent);
            continue;
        } 

        const sourceBuffer = await readFile(filePath);
        const source = sourceBuffer.toString();

        if (fileContent.type !== PathType.Astro) {
            fileContent.source = source;
            fileContent.nodes = [];
            fileContent.error = undefined;
            contents.push(fileContent);
            continue;
        }

        contents.push(await parseAstroFile(fileContent, source));
    }

    return contents;
}

/**
 * Calls and returns the result of call as T
 * @param {string} modulePath 
 * @param {string} funcName 
 * @param {any[]} funcArgs 
 * @returns {data?: T, error?: string}
 */
export const callFuncInModule = async <T>(modulePath: string, funcName: string, funcArgs: any[]): 
    Promise<{error?: string, data?: T}> => {
    const ret: {
        error?: string,
        data?: T,
    } = {}
    
    const moduleType = identifyModuleType(modulePath);
    if (moduleType === ModuleType.Untracked) {
        return {error: `The ${modulePath} module path to call ${funcName} is not in the tracked directory`}
    }

    if (moduleType === ModuleType.Script) {
        const script = await getScriptByPath(modulePath)
        if (script === undefined) {
            return {error: `No script at ${modulePath}, make sure it exists or its the bug of getScriptByPath`}
        }
        ret.data = await (script.glob as any)[funcName](...funcArgs)
    } else {
        return {error: `callFuncInModule supports scripts only for now`}
    }

    return ret;
}

export const fileContentByModulePath = async(modulePath: string): Promise<{error?: string, data?: FileContent}> => {
    const moduleType = identifyModuleType(modulePath);
    if (moduleType === ModuleType.Untracked) {
        return {error: `identifyValue(modulePath='${modulePath}')/identifyModuleType(modulePath='${modulePath}'): the module is not tracked`}
    }

    if (moduleType === ModuleType.Script) {
        const script = await getScriptByPath(modulePath);
        if (script === undefined) {
            return {error: `identifyValue(modulePath='${modulePath}')/getScriptPath(modulePath='${modulePath}'): the script wasn't returned by path`}
        }
        return {
            data: script,
        }
    } 
    
    return {error: `identifyValue(modulePath='${modulePath}')/identifyModuleType(modulePath='${modulePath}'): only Scripts are supported for now`}
}


/**
 * Sets the code and nodes properties of the file content if it's an Astro file
 * @param {FileContent} fileContent the file parameters 
 * @param astroSource through the file system we read the content of the file
 * @returns {Promise<FileContent>} fileContent with the `nodes` and `code` properties set
 */
const parseAstroFile = async (fileContent: FileContent, astroSource: string): Promise<FileContent> => {
    if (fileContent.type !== PathType.Astro) {
        return fileContent;
    }
    
    const result = await AstroParse(astroSource, {
        position: false, // defaults to `true`
    });

    const {frontmatterCode, componentNodes} = extractAstroComponents(result.ast);

    fileContent.source = frontmatterCode.length > 0 ? frontmatterCode : undefined;
    fileContent.nodes = componentNodes.length > 0 ? componentNodes : undefined;
    fileContent.error = undefined;

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
const extractAstroComponents = (ast: RootNode): {componentNodes: NodeType[], frontmatterCode: string} => {
    const componentNodes: NodeType[] = [];
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
        } else {
            console.log(`The page has ${child.type} node`)
            console.log(`Its data:`)
            console.log(child)
        }
    }

    return {componentNodes, frontmatterCode};
}

/**
 * Convert the Astro to the typescript so that we can use the Typescript AST manipulator to detect all components
 * @param fileName a full path to the file name that ends with .astro extension
 * @param astroSource a content of the file
 * @returns {TransformResult}
 */
const astroToTs = async(fileName: string, astroSource: string): Promise<TransformResult> => {
    const result = await transform(astroSource, {
        filename: fileName,
        sourcemap: "both",
        internalURL: "astro/runtime/server/index.js",
    });

    return result;
}
