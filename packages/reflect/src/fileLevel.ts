/**
 * The file level works with the contents and the file system.
 * And returns the FileContent from globs as a source code, and astro components.
 * 
 * Receives the GLOBS and returns FileContents.
 */
import { parse as AstroParse, transform, type TransformResult } from "@astrojs/compiler";
import type { RootNode } from "@astrojs/compiler/types";
import { readFile } from "node:fs/promises"
import type { AstroInstance } from 'astro';
import PathModule from "node:path"
import { identifyModuleType, ModuleType, trimPath } from "./module.js";
import { getScriptByPath } from "./script.js";
import { Result, Debug } from "@ara-web/ts-enhancement";
import { getNodejsModuleByPath } from "./enabledNodejsModule.js";
import type { ValueType } from "./code-level/ast-node.js";
import type { AstroNode } from "@ara-web/component-engine";


/**
 * The content of any page will contain list of the nodes and code, usually a frontmatter.
 * Component nodes and source code splitted
 */
export type UiContent = {
    nodes?: AstroNode[], 
    source?: string,
    fileExtension: FileExtension,
    filePath: string,
    error?: string,
    glob?: unknown,
}

export type IdentifiedFileContent = {
    fileContent: UiContent,
    modulePath: string,
    moduleType: ModuleType,
}

let cache: {[key: string]: IdentifiedFileContent} = {};


/**
 * @param modulePath The module path is used to define the absolute path to the file
 * @param glob 
 * @returns 
 */
export const globToFileContent = async (modulePath: string, glob: Promise<unknown> | unknown): Promise<Result<UiContent>> => {
    // Astro framework adds the absolute file paths.
    let filePath = (glob as AstroInstance).file as string;
    if (filePath === undefined) {
        filePath = process.cwd() + PathModule.resolve(modulePath);
    }
    const fileContent: UiContent = {
        filePath,
        fileExtension: getFileExtension(filePath),
        glob: glob,
    }

    if (fileContent.fileExtension === FileExtension.DirectoryOrUndefined) {
        return Result.fail(
            `The path is directory or undefined`,
            `Ara Web doesn't support '${filePath}' file path derived from '${modulePath}' module path`
        )
    } 

    const sourceBuffer = await readFile(filePath);
    const source = sourceBuffer.toString();

    if (fileContent.fileExtension !== FileExtension.Astro) {
        fileContent.source = source;
        fileContent.nodes = [];
        fileContent.error = undefined;
        return Result.ok(fileContent);
    }

    return Result.ok(await parseAstroFile(fileContent, source));
}

/** 
 * For Pages: There are Markdown (.md extension) files that we won't count.
 * There are other pages that we won't count for now.
 * For example: 
 * @example Get the pages parseGlob<Page>(`../pages/ara/`, eager: true);
 * @todo To identify the RPCs by components, use a special Typescript parser
 * For now we rely on the component names
 * @param globs
*/
export const globsToFileContents = async(globs: Record<string, () => Promise<unknown>> | Record<string, unknown>): Promise<UiContent[]> => {
    let contents: UiContent[] = [];

    for (let glob in globs) {
        let filePath = (globs[glob] as AstroInstance).file as string;
        if (filePath === undefined) {
            filePath = process.cwd() + PathModule.resolve(glob);
        }
        const fileContent: UiContent = {
            filePath,
            fileExtension: getFileExtension(filePath),
            glob: globs[glob],
        }

        if (fileContent.fileExtension === FileExtension.DirectoryOrUndefined) {
            fileContent.error = "Filepath is not supported by Ara Web"
            contents.push(fileContent);
            continue;
        } 

        const sourceBuffer = await readFile(filePath);
        const source = sourceBuffer.toString();

        if (fileContent.fileExtension !== FileExtension.Astro) {
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

export const identifierInModule = async (modulePath: string, identifier: string) => {
    const module = await import(modulePath);
    const  {Icon} = await import(modulePath);
    Debug.log(`\n\Module '${modulePath}' was returned check '${identifier}':`);
    Debug.log(module);
    Debug.log(`\n\nThe default of module:`)
    Debug.log(module.default)
    Debug.log(`The identifier exists in Module?`)
    Debug.log(module[identifier])
    Debug.log(`The Icon exists in Module?`)
    Debug.log(Icon)
    Debug.log(`Has library and icon`)
    Debug.log(module['icon'])
}

/**
 * Calls and returns the result of call as T
 * @param {string} modulePath 
 * @param {string} funcName 
 * @param {any[]} funcArgs 
 * @returns {data?: T, error?: string}
 */
export const callFuncInModule = async (modulePath: string, funcName: string, funcArgs: any[]): 
    Promise<Result<ValueType>> => {
    
    Debug.push(`fileContentByModulePath()`, {modulePath})
    const identified = await fileContentByModulePath(modulePath);
    Debug.pop();
    if (identified.isFailure) {
        return Result.fail(
            `fileContentByModulePath(modulePath: '${modulePath}'): ${identified.errorTitle}`,
            identified.errorDescription!
        )
    }

    if (identified.getValue().moduleType === ModuleType.Script) {
        let data = await (identified.getValue().fileContent.glob as any)[funcName](...funcArgs)
        return Result.ok(data as ValueType);
    } else if (identified.getValue().moduleType === ModuleType.NodeJsModule) {
        let data = await (identified.getValue().fileContent.glob as any)[funcName](...funcArgs)
        return Result.ok(data as ValueType);
    }

    return Result.fail(
        `Unsupported module type`,
        `The ${identified.getValue().moduleType} kind of modules are not yet supported by Ara Web, update callFuncInModule()`
    )
}


/**
 * Sets the code and nodes properties of the file content if it's an Astro file
 * @param {UiContent} fileContent the file parameters 
 * @param astroSource through the file system we read the content of the file
 * @returns {Promise<UiContent>} fileContent with the `nodes` and `code` properties set
 */
const parseAstroFile = async (fileContent: UiContent, astroSource: string): Promise<UiContent> => {
    if (fileContent.fileExtension !== FileExtension.Astro) {
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
const extractAstroComponents = (ast: RootNode): {componentNodes: AstroNode[], frontmatterCode: string} => {
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
        } else {
            console.log(`The page has unsupported ${child.type} node, Update the extractAstroComponents in Reflect`)
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
