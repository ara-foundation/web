export { ModuleCategory, ModulePartitioner, extractModuleCategory, ModuleIdentifier } from "./module.js";
export { FileExtension, DEFAULT_SLOT, ElementType } from "./ontology/index.js";
export { AstroNodeTraits } from "./astro-node.js";
export { CodeLevel } from "./code-level/index.js";
export { PageLevel } from "./page-level/index.js";
export { ComponentLevel } from "./component-level/index.js";
import { ReflectAstroFramework as ReflectExtension } from "./ReflectExtension.js";
export const ReflectAstroFramework = ReflectExtension;
export default ReflectExtension;
