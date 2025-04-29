import { Result } from "@ara-web/ts-enhancement/result";
import { type ModuleParts } from "#ontology";
import type { ModuleMemory } from "@ara-web/reflect/memory";
/**
 * Ontologically, `PageLevel` supports translation of modules into `Page` data
 */
export declare class PageLevel {
    /**
     * Generates the UI Page from the module `parts` and `memory`.
     * @param {Parts} parts
     * @returns {Component}
     */
    static identify: <T>(parts: ModuleParts, rawMemory: ModuleMemory<T>) => Promise<Result<T>>;
    private static validateModuleParts;
    /**
     * Extracts the Title, Description from the Page Meta.
     * Returns true if extraction was successful. Otherwise returns false and
     * the error message will be set in the page.title and page.description
     */
    private static getMetaFromComment;
    /**
     * Identify each component within the page. All data of the page are represented as the components.
     * @returns {Result<AraPage>}
     */
    private static identifySlots;
}
