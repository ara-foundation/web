import { Reflect } from "@ara-web/reflect";
import { ReflectAstroFramework } from "@ara-web/reflect-astro-ext";

const astroReflect = new ReflectAstroFramework();
const reflect = new Reflect({extensions: [astroReflect]});

let importModuleClause = "@ara-web/reflect";
let module = await import(importModuleClause);
let importLink = await reflect.nodeJsExt.putPackage({importModuleClause,module})

importModuleClause = "@ara-web/reflect-astro-ext";
module = await import(importModuleClause);
importLink = await reflect.nodeJsExt.putPackage({importModuleClause,module})

const records = import.meta.glob("../**/*.{ts,astro,svg}", {eager: true});
records["./setup-reflect.ts"] = await import("./setup-reflect");
const importMetaFilename = import.meta.filename;
const importedModules = await astroReflect.putModules({records, importMetaFilename});

export default reflect;