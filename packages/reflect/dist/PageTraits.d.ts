import { Result } from "@ara-web/ts-enhancement";
import type { Page } from "@ara-web/ts-enhancement";
import { type UiContent } from "./ui-level/ui-content.js";
import { Code } from "./code-level/Code.js";
export declare class PageTraits {
    private _page;
    private _code;
    get page(): Page;
    get code(): Code;
    private constructor();
    /**
     * Converts the file content into the page trait
     * @param {UiContent} fileContent
     * @returns {error?: string, data?: PageTraits}
     */
    static fromFileContent: (fileContent: UiContent) => Result<PageTraits>;
    /**
     * Validates the file content to be a page.
     * The pages are for example only .astro files that has frontmatter and at least a one component.
     * @returns {Page}
     */
    private identifyPageByFileContent;
    /**
     * Extracts the Title, Description from the Page Meta.
     * Returns true if extraction was successful. Otherwise returns false and
     * the error message will be set in the page.title and page.description
     */
    private identifyPageByComment;
}
