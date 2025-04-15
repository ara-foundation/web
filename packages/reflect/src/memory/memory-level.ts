import { Debug, Result } from "@ara-web/ts-enhancement";
import { identifyModuleType, trimPath, type ModuleType } from "../module.js";
import type { Memory } from "./Memory.js";
import { AstIdentifiers } from "../code-level/ast-node.js";
import { getScriptByPath } from "../script.js";
import { getNodejsModuleByPath } from "../enabledNodejsModule.js";

