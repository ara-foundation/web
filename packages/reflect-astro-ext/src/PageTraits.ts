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
import { FileExtension } from "./module.js";
import { Code } from "@ara-web/reflect/code-level";

//////////////////////////////////////////////////////////////////
//
// The internal data types
//
//////////////////////////////////////////////////////////////////

export class PageTraits {
    private _page!: AraPage;
    private _code!: Code;

    public get page(): AraPage {
        return this._page;
    }

    public get code(): Code {
        return this._code;
    }

    //////////////////////////////////////////////////////////////////////////////
    //
    // Initialization
    //
    //////////////////////////////////////////////////////////////////////////////

    private constructor() {}

    /**
     * Converts the file content into the page trait
     * @param {UiContent} fileContent 
     * @returns {error?: string, data?: PageTraits}
     */
    public static fromFileContent = (fileContent: UiContent): Result<PageTraits> => {
        let pageTraits = new PageTraits();
        const result = pageTraits.identifyPageByFileContent(fileContent)
        
        if (result.isFailure) {
            return Result.fail("identifyPageByFileContent: " + result.errorTitle!, result.errorDescription!)
        } else {
            pageTraits._page = result.getValue();
        }

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
     * Validates the file content to be a page.
     * The pages are for example only .astro files that has frontmatter and at least a one component.
     * @returns {AraPage}
     */
    private identifyPageByFileContent = (uiContent: UiContent): Result<AraPage> => {
        const page: AraPage = {
            title: "Warning: Undefined",
            description: "Not yet set",
            fileName: uiContent.absoluteModulePath.substring(uiContent.absoluteModulePath.lastIndexOf("/src/pages") + "/src/pages".length),
            glob: uiContent.glob,
        }
    
        if (uiContent.fileExtension !== FileExtension.Astro) {
            return Result.fail("Unsupported page type", "Only .astro files should be in the pages")
        }
        if (uiContent.source === undefined) {
            return Result.fail("Missing scripts in astro frontmatter", "Please include the astro scripts even if its empty");
        }
    
        if (uiContent.elements === undefined) {
            return Result.fail("Missing any component", "Please include the any component even if its empty");
        }
    
        return Result.ok(page);
    }

    /**
     * Extracts the Title, Description from the Page Meta.
     * Returns true if extraction was successful. Otherwise returns false and
     * the error message will be set in the page.title and page.description
     */
    private identifyPageByComment = (source: string): Result<undefined> => {
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