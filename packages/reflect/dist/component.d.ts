import { type Component, Result } from "@ara-web/ts-enhancement";
import type { ModuleMemory } from "./memory/ModuleMemory.js";
export declare const fileContentToComponent: (memory: ModuleMemory<unknown>) => Promise<Result<Component>>;
