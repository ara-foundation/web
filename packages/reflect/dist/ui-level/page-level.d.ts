import { Result, type Page } from "@ara-web/ts-enhancement";
import { type UiContent } from "./ui-content.js";
import type { Code } from "../code-level/Code.js";
/**
 * Converts the file content into the page trait
 * @param {UiContent} uiContent
 * @returns {error?: string, data?: PageTraits}
 */
export declare const uiContentToPage: (uiContent: UiContent) => Result<Page>;
/**
 * Identify each component within the page. All data of the page are represented as the components.
 * @returns {Result<Page>}
 */
export declare const identifyComponents: (page: Page, uiContent: UiContent, code: Code) => Promise<Result<Page>>;
