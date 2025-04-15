/**
 * All operations goes through this reflect.
 * It loads the globs, and using the @ara-web/reflect converts to
 * - Page
 * - Component
 * - Layout
 * - RPC etc.
 */

import { Reflect, type CategorizedModuleGlobs, type ModuleGlobs, ModuleType } from "@ara-web/reflect";

const importModules = (): CategorizedModuleGlobs => {
    const moduleGlobs: CategorizedModuleGlobs = {};

    moduleGlobs[ModuleType.NodeJsModule] = getNodeJsModuleGlobs();
    moduleGlobs[ModuleType.Page] = getPageGlobs();
    moduleGlobs[ModuleType.Layout] = getLayoutGlobs();
    moduleGlobs[ModuleType.Component] = getComponentGlobs();
    moduleGlobs[ModuleType.Script] = getScriptGlobs();

    return moduleGlobs;
}

const getNodeJsModuleGlobs = (): ModuleGlobs => {
    const moduleGlobs: ModuleGlobs = {};
    const glob1 = import.meta.glob(
        './../../node_modules/@fortawesome/free-solid-svg-icons/index.mjs', {eager: true}
    );

    for (let modulePath in glob1) {
        moduleGlobs["@fortawesome/free-solig-svg-icons"] = {
            glob: glob1[modulePath],
        }
    }

    const glob2 = import.meta.glob(
        './../../node_modules/@fortawesome/fontawesome-svg-core/index.mjs', {eager: true}
    );

    for (let modulePath in glob2) {
        moduleGlobs["@fortawesome/fontawesome-svg-core"] = {
            glob: glob2[modulePath],
        }
    }

    const glob3 = import.meta.glob(
        './../../node_modules/@ara-web/ts-enhancement/dist/index.js', {eager: true}
    );

    for (let modulePath in glob3) {
        moduleGlobs["@ara-web/ts-enhancement"] = {
            glob: glob3[modulePath],
        }
    }

    return moduleGlobs;
}

const getPageGlobs = (): ModuleGlobs => {
    const globs = import.meta.glob('../pages/ara/**/*.astro', {eager: true});

    const certainI = 1;
    let counter = 0;

    const moduleGlobs: ModuleGlobs = {};
    for (let modulePath in globs) {
        counter++;
        if (counter - 1 < certainI) {
            continue;
        }
        moduleGlobs[modulePath] = {
            glob: globs[modulePath],
        }
        if (certainI > -1) {
            break; // only first page
        }
    }
    return moduleGlobs;
}

const getComponentGlobs = (moduleType?: ModuleType): ModuleGlobs => {
    let globs = import.meta.glob('@components/**/*.{astro,tsx,jsx}', {eager: true})
    const moduleGlobs: ModuleGlobs = {};
    for (let modulePath in globs) {
        moduleGlobs[modulePath] = {
            glob: globs[modulePath],
        }
    }
    return moduleGlobs;
}

const getLayoutGlobs = (moduleType?: ModuleType): ModuleGlobs => {
    let globs = import.meta.glob('@layouts/**/*.{astro,tsx,jsx}', {eager: true})//relative to this component file
    const moduleGlobs: ModuleGlobs = {};
    for (let modulePath in globs) {
        moduleGlobs[modulePath] = {
            glob: globs[modulePath],
        }
    }
    return moduleGlobs;
}

const getScriptGlobs = (): ModuleGlobs => {
    let globs = import.meta.glob('@scripts/**/*.ts', {eager: true})//relative to this component file
    const moduleGlobs: ModuleGlobs = {};
    for (let modulePath in globs) {
        const glob = globs[modulePath]
        if (modulePath.indexOf("reflectCopy.ts") > -1) {
            modulePath = modulePath.replace("reflectCopy.ts", "reflect.ts")
        }
        moduleGlobs[modulePath] = {
            glob: glob,
        }
    }

    return moduleGlobs;
}

const reflect = new Reflect();
reflect.putAutoGlobImporter(importModules);

export default reflect;