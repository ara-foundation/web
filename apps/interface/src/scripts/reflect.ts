/**
 * All operations goes through this reflect.
 * It loads the globs, and using the @ara-web/reflect converts to
 * - Page
 * - Component
 * - Layout
 * - RPC etc.
 */

import { Reflect, ModuleLink } from "@ara-web/reflect";
import { NodejsReflectExtension } from "@ara-web/reflect/nodejs-ext";
import { ReflectAstroExtension } from "@ara-web/reflect-astro-ext";
import { Debug, Result } from "@ara-web/p-hintjens";

const astroProxy = new ReflectAstroExtension();
const reflect = new Reflect({extensions: [astroProxy], packageLink: ModuleLink.newPackageURL("@ara-web", "interface")});

const putPkg = async(nodeJsExt: NodejsReflectExtension, pkgName: string): Promise<Result<ModuleLink>> => {
    let module = await import(pkgName);
    let putted = await nodeJsExt.putPackage({importModuleClause: pkgName, module});
    if (putted.isFailure) {
        return Result.fail(`nodeJsExt.putPackage('${pkgName}'): ${putted.errorTitle}`, putted.errorDescription!);
    }
    return Result.ok(putted.getValue())
}

// Add NodeJS Packages
const putPkgs = async (nodeJsExt: NodejsReflectExtension) => {
    [
        '@fortawesome/free-solid-svg-icons', 
        '@fortawesome/fontawesome-svg-core',
        '@ara-web/p-hintjens',
        '@ara-web/rpc-engine'
    ].forEach(async(pkgName) => {
        // Font Awesome's Icons
        let pkgLink = await putPkg(nodeJsExt, pkgName);
        if (pkgLink.isFailure) {
            throw Result.fail(`putPkg(): ${pkgLink.errorTitle}`, pkgLink.errorDescription!);
        } else {
            Debug.log(`Pkg putted: ${pkgLink.getValue().moduleURL}`)
        }
    });
}
await putPkgs(reflect.nodeJsExt);

// Put the Astro Framework
const astroModules = import.meta.glob('../**/*.{astro,tsx,jsx,ts,js,svg,md}', {eager: true})
astroModules["./reflect.ts"] = await import("./reflect.js");
const puttedModules = await astroProxy.putModules({records: astroModules, importMetaFilename: import.meta.filename});
if (puttedModules.isFailure) {
    throw puttedModules;
}

export default reflect;