/**
 * Ara Web Level Reflection that deals with the Astro Components and Astro Component Attributes
 */
import { parse as commentParse} from "comment-parser";

import { Result } from "@ara-web/ts-enhancement";
import type { AraPage } from "@ara-web/ts-enhancement";

// The pages traits adds to the Page the following:
// -- RPCs and refer to RPC types
// -- File Content
// -- AST
// -- Components
import { Code } from "@ara-web/reflect/code-level";
import type { ModuleParts } from "../../module.js";



/**
 * UI Level creates a web page based on the memory and elements.
 */
export class UILevel {

    private constructor() {
    }

    /**
     * Converts the file content into the page trait
     * @returns {error?: string, data?: PageTraits}
     */
    public static fromModuleParts = (moduleParts: ModuleParts): Result<PageTraits> => {
        let pageTraits = new PageTraits();
        const result = pageTraits.identifyPageByFileContent(fileContent)
        
        const commentResult = pageTraits.identifyPageByComment(fileContent.source!);
        if (commentResult.isFailure) {
            return Result.fail("identifyPageByComment: " + result.errorTitle!, result.errorDescription!)
        }

        if (pageTraits._page.rpcs === undefined) {
            pageTraits._page.rpcs = {};
        }
        if (pageTraits._page.components === undefined) {
            pageTraits._page.components = {};
        }
        if (pageTraits._page.metaComponents === undefined) {
            pageTraits._page.metaComponents = [];
        }

        pageTraits._code = new Code(fileContent.source!);

        return Result.ok(pageTraits);
    }

    /**
     * Extracts the Title, Description from the Page Meta.
     * Returns true if extraction was successful. Otherwise returns false and
     * the error message will be set in the page.title and page.description
     */
    public static identifyPageByComment = (source: string): Result<undefined> => {
        const parsed = commentParse(source);
        if (parsed.length === 0) {
            return Result.fail("Page has no comment", "The web page is missing any comment in the JSDoc format")
        }
    
        let pageCommentFound = false;
        let pageTitleFound = false;
        let pageDescriptionFound = false;
        
        for (let block of parsed) {
            for (let tag of block.tags) {
                if (tag.tag === "this") {
                    if (tag.name === "Page") {
                        pageCommentFound = true;
                    }
                } else if (tag.tag === "param") {
                    if (tag.type !== "string") {
                        continue;
                    }
                    if (tag.name === "Title") {
                        if (tag.description.length > 0) {
                            this._page.title = tag.description;
                            pageTitleFound = true;
                        }
                    } else if (tag.name === "Description") {
                        if (tag.description.length > 0) {
                            this._page.description = tag.description;
                            pageDescriptionFound = true;
                        }
                    }
                }
            }
    
            if (!pageCommentFound) {
                return Result.fail("Invalid Comment Detection", "Missing a '@type Page' in the page comment")
            } else if (!pageTitleFound) {
                return Result.fail("Invalid Title", "Missing the '@param {string} Title {...}'")
            } else if (!pageDescriptionFound) {
                return Result.fail("Invalid Description", "Missing the '@param {string} Description {...}' in the page comment")
            } 
    
            if (pageCommentFound && pageTitleFound && pageDescriptionFound) {
                return Result.ok();
            }
        }
    
        return Result.fail("Invalid Page Comment Detection", "No comment dedicated for the web page itself");
    }
}