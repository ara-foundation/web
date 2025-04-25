import { 
    trimPath,
    ModuleCategory as BaseCategory,
    FileExtension as BaseExtension
} from "@ara-web/reflect";
import { enumValues, Result } from "@ara-web/ts-enhancement";

export enum ModuleCategory {
    Script = "scripts",
    Component = "components",
    Page = "pages",
    Layout = "layouts"
}

export enum FileExtension {
    Astro = ".astro",
    Tsx = BaseExtension.Tsx,
    Jsx = BaseExtension.Jsx,
    Typescript = BaseExtension.Typescript,
    Javascript = BaseExtension.Javascript,
}

/**
 * Identify the path as path to a script, component, or a page?
 * @param {string} path the file path 
 * @returns {ModuleCategory}
 */
export const identifyModuleType = (path: string): ModuleCategory|BaseCategory => {
    path = trimPath(path);
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
    const identifiedFileExtension = getFileExtension(modulePath);
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

/**
 * Detects the file type by the file extension
 * @param filePath the full path to the file within the Ara Web
 * @returns {FileExtension}
 */
const getFileExtension = (filePath: string): Result<FileExtension> => {
    const extensionIndex = filePath.lastIndexOf(".");
    if (extensionIndex === -1) {
        return Result.fail(
            `Extension not found in the given file path`,
            `The '${filePath}' file path doesn't have an extension`
        )
    }

    const extension = filePath.substring(extensionIndex);

    const pathTypes = enumValues(FileExtension).filter((pathType) => (pathType === extension)).map((pathType) => (pathType as FileExtension))
    if (pathTypes.length > 0) {
        return Result.ok(pathTypes[0]);
    }

    return Result.fail(
        `The module's '${extension}' extension not supported`,
        `The '${filePath}' doesn't have recognized file extension`
    )
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
