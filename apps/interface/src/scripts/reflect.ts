/**
 * All operations goes through this reflect.
 * It loads the globs, and using the @ara-web/reflect converts to
 * - Page
 * - Component
 * - Layout
 * - RPC etc.
 */

import { Reflect, type ModuleGlobs, ModuleType } from "@ara-web/reflect";

const importModules = (): ModuleGlobs => {
    const moduleGlobs: ModuleGlobs = {};

    moduleGlobs[ModuleType.NodeJsModule] = getNodeJsModuleGlobs();
    moduleGlobs[ModuleType.Page] = getPageGlobs();
    moduleGlobs[ModuleType.Layout] = getLayoutGlobs();
    moduleGlobs[ModuleType.Component] = getComponentGlobs();
    moduleGlobs[ModuleType.Script] = getScriptGlobs();

    return moduleGlobs;
}
// import { globsToFileContents, type FileContent } from "./fileLevel.js";

const getNodeJsModuleGlobs = (): Record<string, unknown> => {
    const globs = import.meta.glob([
        // @fortawesome/free-solig-svg-icons
        '../../../node_modules/@fortawesome/free-solid-svg-icons/index.mjs',
        // @fortawesome/fontawesome-svg-core
        '../../../node_modules/@fortawesome/fontawesome-svg-core/index.mjs',
        ],
        {eager: true}
    );
    return globs;
    // const fileContents = await globsToFileContents(globs);

    // return fileContents;
    // return [];
}

const getPageGlobs = (): Record<string, unknown> => {
    const globs = import.meta.glob('../pages/ara/**/*.astro', {eager: true});
    return globs;
}

const getComponentGlobs = (moduleType?: ModuleType): Record<string, unknown> => {
    let componentGlobs = import.meta.glob('@components/**/*.{astro,tsx,jsx}', {eager: true})
    return componentGlobs;
}

const getLayoutGlobs = (moduleType?: ModuleType): Record<string, unknown> => {
    let layoutGlobs = import.meta.glob('@layouts/**/*.{astro,tsx,jsx}', {eager: true})//relative to this component file
    return layoutGlobs;
}

// export const getNodejsModuleByPath = async (path: string): Promise<FileContent|undefined> => {
//     const nodeJsModules = await getNodeJsModules();
//     Debug.log(`There are ${nodeJsModules.length} modules`);
//     for (let nodeJsModule of nodeJsModules) {
//         const exist = nodeJsModule.filePath.indexOf(path) > -1;
//         if (exist) {
//             return nodeJsModule;
//         }
//     }

//     return undefined;
// }

const getScriptGlobs = (): Record<string, unknown> => {
    let globs = import.meta.glob('@scripts/**/*.ts', {eager: true})//relative to this component file

    // const fileContents = await globsToFileContents(globs);

    // return fileContents;
    return globs;
}

// /**
//  * Try to get the script by the path name
//  * @param {string} path to import the script
//  * @returns {FileContent|Undefined}
//  */
// export const getScriptByPath = async (path: string): Promise<FileContent|undefined> => {
//     path = trimPath(path);
//     const scripts = await getScripts();
//     for (let script of scripts) {
//         if (script.filePath.indexOf(path + ".ts") > -1 || script.filePath.indexOf(path + "/index.ts") > -1) {
//             return script;
//         }
//     }

//     return undefined;
// }


const reflect = new Reflect();
reflect.putAutoGlobImporter(importModules);

export default reflect;