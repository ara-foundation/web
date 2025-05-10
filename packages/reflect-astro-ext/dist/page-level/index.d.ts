import { Result } from "@ara-web/p-hintjens";
import type { ModuleMemory } from "@ara-web/reflect";
import { type ModuleParts, type Slots, type SlotElement, type WalkFilter } from "../index.js";
import { ProjectMemory } from "@ara-web/reflect";
export { PageObjectNode } from "./page-object-node.js";
export { PageObjectAdapter, pageToObjectNodes } from "./page-object-adapter.js";
/**
 * Ontologically, `PageLevel` supports translation of modules into `Page` data
 */
export declare class PageLevel {
    /**
     * Generates the UI Page from the module `parts` and `memory`.
     * @param {Parts} parts
     * @returns {Component}
     */
    static identify: <T>(parts: ModuleParts, rawMemory: ModuleMemory<T>, projectMemory: ProjectMemory) => Promise<Result<T>>;
    private static validateModuleParts;
    /**
     * Identify each component within the page. All data of the page are represented as the components.
     * @returns {Result<AraPage>}
     */
    private static identifySlots;
    static walk: (slots: Slots, walkFilter: WalkFilter) => SlotElement | undefined;
}
