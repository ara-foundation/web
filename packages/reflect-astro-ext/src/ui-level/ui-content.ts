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
import { ModuleCategory } from "../module.js";
import { Result } from "@ara-web/ts-enhancement";
import type { AstroNode } from "../component.js";

export enum FileExtension {
    Astro = ".astro",
    Tsx = ".tsx",
    Jsx = ".jsx",
    Typescript = ".ts",
    Javascript = ".js",
    DirectoryOrUndefined = "",
}

/**
 * The content of any page will contain list of the nodes and code, usually a frontmatter.
 * Component nodes and source code splitted
 */
export type UiContent = {
    elements?: AstroNode[], 
    source?: string,
    fileExtension: FileExtension,
    absoluteModulePath: string,
    glob?: unknown,
}

export type IdentifiedFileContent = {
    fileContent: UiContent,
    modulePath: string,
    moduleType: ModuleCategory,
}

/**
 * Detects the file type by the file extension, if not supported file then return PathType.DirectoryOrUndefined.
 * @param filePath the full path to the file within the Ara Web
 * @returns {FileExtension}
 */
const getFileExtension = (filePath: string): FileExtension => {
    const extensionIndex = filePath.lastIndexOf(".");
    if (extensionIndex === -1) {
        return FileExtension.DirectoryOrUndefined;
    }

    const extension = filePath.substring(extensionIndex);

    const pathTypes = Object.keys(FileExtension)
    for (const pathType of pathTypes) {
        const key = pathType as keyof typeof FileExtension;
        if (FileExtension[key] === extension) {
            return FileExtension[key];
        }
    }

    return FileExtension.DirectoryOrUndefined;
}

const absolutePath = (modulePath: string, glob: Promise<unknown> | unknown): string => {
    // Astro framework adds the absolute file paths.
    let filePath = (glob as AstroInstance).file as string;
    if (filePath === undefined) {
        filePath = process.cwd() + PathModule.resolve(modulePath);
    }
    return filePath;
}

/**
 * @param modulePath The module path is used to define the absolute path to the file
 * @param glob 
 * @returns 
 */
export const globToUiContent = async (modulePath: string, glob: Promise<unknown> | unknown): Promise<Result<UiContent>> => {
    const absoluteModulePath = absolutePath(modulePath, glob);
    const fileExtension = getFileExtension(absoluteModulePath);
    
    if (fileExtension === FileExtension.DirectoryOrUndefined) {
        return Result.fail(
            `The path is directory or undefined`,
            `Ara Web doesn't support '${absoluteModulePath}' file path derived from '${modulePath}' module path`
        )
    } 
    const fileContent: UiContent = {
        absoluteModulePath,
        fileExtension,
        glob,
    }

    const sourceBuffer = await readFile(absoluteModulePath);
    const source = sourceBuffer.toString();

    if (fileContent.fileExtension !== FileExtension.Astro) {
        fileContent.source = source;
        fileContent.elements = [];
        return Result.ok(fileContent);
    }

    return Result.ok(await parseAstroFile(fileContent, source));
}

// export const identifierInModule = async (modulePath: string, identifier: string) => {
//     const module = await import(modulePath);
//     const  {Icon} = await import(modulePath);
//     Debug.log(`\n\Module '${modulePath}' was returned check '${identifier}':`);
//     Debug.log(module);
//     Debug.log(`\n\nThe default of module:`)
//     Debug.log(module.default)
//     Debug.log(`The identifier exists in Module?`)
//     Debug.log(module[identifier])
//     Debug.log(`The Icon exists in Module?`)
//     Debug.log(Icon)
//     Debug.log(`Has library and icon`)
//     Debug.log(module['icon'])
// }

// /**
//  * Calls and returns the result of call as T
//  * @param {string} modulePath 
//  * @param {string} funcName 
//  * @param {any[]} funcArgs 
//  * @returns {data?: T, error?: string}
//  */
// export const callFuncInModule = async (modulePath: string, funcName: string, funcArgs: any[]): 
//     Promise<Result<ValueType>> => {
    
//     Debug.push(`fileContentByModulePath()`, {modulePath})
//     const identified = await fileContentByModulePath(modulePath);
//     Debug.pop();
//     if (identified.isFailure) {
//         return Result.fail(
//             `fileContentByModulePath(modulePath: '${modulePath}'): ${identified.errorTitle}`,
//             identified.errorDescription!
//         )
//     }

//     if (identified.getValue().moduleType === ModuleType.Script) {
//         let data = await (identified.getValue().fileContent.glob as any)[funcName](...funcArgs)
//         return Result.ok(data as ValueType);
//     } else if (identified.getValue().moduleType === ModuleType.NodeJsModule) {
//         let data = await (identified.getValue().fileContent.glob as any)[funcName](...funcArgs)
//         return Result.ok(data as ValueType);
//     }

//     return Result.fail(
//         `Unsupported module type`,
//         `The ${identified.getValue().moduleType} kind of modules are not yet supported by Ara Web, update callFuncInModule()`
//     )
// }

// const identifyFileContent = async (modulePath: string): Promise<Result<IdentifiedFileContent>> => {
//     Debug.push(`identifyModuleType()`, {path: modulePath})
//     const moduleType = await identifyModuleType(modulePath);
//     Debug.pop();
//     Debug.log(`The identified module type:`)
//     Debug.log(moduleType)
//     if (moduleType === ModuleType.Untracked) {
//         return Result.fail(
//             `identifyModuleType(modulePath='${modulePath}')`,
//             `The module path is not tracked by Ara Web`
//         )
//     }

//     if (moduleType === ModuleType.Script) {
//         const script = await getScriptByPath(modulePath);
//         if (script === undefined) {
//             return Result.fail(
//                 `moduleType=ModuleType.Script: getScriptByPath(modulePath='${modulePath}')`,
//                 `The script is not defined in the scripts path, are you sure that file exists or has the valid file extension?`
//             )
//         }
//         return Result.ok({modulePath, moduleType, fileContent: script})
//     } else if (moduleType === ModuleType.Layout) {
//         Debug.log(`Module '${modulePath}' is layout, get the layout: Unsupported yet`)
//         // const fileContent = await componentFileContent(modulePath, moduleType);
//         // if (fileContent.isFailure) {
//         //     return Result.fail(
//         //         `getComponentByPath(modulePath: '${modulePath}', moduleType: '${moduleType}'): ${fileContent.errorTitle}`,
//         //         fileContent.errorDescription!
//         //     )
//         // }

//         // return Result.ok({modulePath, moduleType, fileContent: fileContent.getValue()})
//     } else if (moduleType === ModuleType.NodeJsModule) {
//         const module = await getNodejsModuleByPath(trimPath(modulePath));
//         if (module === undefined) {
//             return Result.fail(
//                 `moduleType=ModuleType.NodeJsModule: getNodejsModuleByPath(modulePath: '${modulePath}')`,
//                 `The module is not enabled, are you sure that file exists and has valid extension?`
//             )
//         } else {
//             return Result.ok({modulePath, moduleType, fileContent: module})
//         }
//     }
    
//     return Result.fail(
//         'Unsupported module type',
//         `Only Script modules are supported, not '${moduleType}' modules`
//     )
// }

// /**
//  * Get the file content loaded from modulePath.
//  * It first attempts to load the data from the internal file content cache.
//  * If doesn't exist, then identifies the file content, then caches the file content
//  * before sending the file content back to the user.
//  * @param {string} modulePath the module's path within the Ara Web
//  * @returns 
//  */
// export const fileContentByModulePath = async(modulePath: string): Promise<Result<IdentifiedFileContent>> => {
//     if (modulePath in cache) {
//         return Result.ok(cache[modulePath]);
//     }

//     Debug.log(`The file content cache doesn't have the '${modulePath}' file content, identify it`);
//     Debug.push(`identifyFileContent()`, {modulePath})
//     const identified = await identifyFileContent(modulePath);
//     Debug.pop();

//     if (identified.isFailure) {
//         return Result.fail(
//             `identifyFileContent(modulePath: '${modulePath}'): ${identified.errorTitle}`,
//             identified.errorDescription!
//         )
//     }
//     cache[modulePath] = identified.getValue();

//     return Result.ok(identified.getValue());
// }


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
    fileContent.elements = componentNodes.length > 0 ? componentNodes : undefined;

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
