/**
 * Ara Web Level Reflection that deals with the Astro Components and Astro Component Attributes
 */
import { parse as commentParse} from "comment-parser";

import { OkResult, Result, type AraPage } from "@ara-web/ts-enhancement";

// The pages traits adds to the Page the following:
// -- RPCs and refer to RPC types
// -- File Content
// -- AST
// -- Components
import type { Code } from "@ara-web/reflect/code-level";
import { FileExtension, type ModuleParts } from "../../module.js";
import type { ModuleMemory } from "@ara-web/reflect/memory";
// Make sure that we move the component

type PageFromComments = {
    title: string;
    description: string;
}

export class PageLevel {
    private static validateParts = (parts: ModuleParts): OkResult => {
        if (parts.fileExtension !== FileExtension.Astro) {
            return OkResult.fail("Unsupported page type", "Only .astro files should be in the pages")
        }
        
        // Identifying the page title and description needs the source code.
        if (parts.source === undefined) {
            return OkResult.fail("Missing scripts in astro frontmatter", "Please include the astro scripts even if its empty");
        }
        
        if (parts.elements === undefined) {
            return OkResult.fail("Missing any component", "Please include the any component even if its empty");
        }

        return OkResult.ok();
    }
    /**
     * Generates the page from the `parts` and `memory`.
     * @param {Parts} parts 
     * @returns {error?: string, data?: PageTraits}
     */
    public static identifyPage = (parts: ModuleParts, memory: ModuleMemory<AraPage>): Result<AraPage> => {
        const validated = this.validateParts(parts);
        if (validated.isFailure) {
            return Result.fail(`this.validateParts(): ${validated.errorTitle}`, validated.errorDescription!)
        }
        
        const page: AraPage = {
            title: "Warning: Undefined",
            description: "Not yet set",
            fileName: memory.moduleLink.moduleURL,
            glob: memory.glob,
        }
        
        const commentResult = this.identifyPageByComment(parts.source!);
        if (commentResult.isFailure) {
            return Result.fail("identifyPageByComment: " + commentResult.errorTitle!, commentResult.errorDescription!)
        }

        if (page.rpcs === undefined) {
            page.rpcs = {};
        }
        
        if (page.components === undefined) {
            page.components = {};
        }
        
        if (page.metaComponents === undefined) {
            page.metaComponents = [];
        }

        page.title = commentResult.getValue().title;
        page.description = commentResult.getValue().description;

        return Result.ok(page);
    }

    /**
     * Extracts the Title, Description from the Page Meta.
     * Returns true if extraction was successful. Otherwise returns false and
     * the error message will be set in the page.title and page.description
     */
    private static identifyPageByComment = (source: string): Result<PageFromComments> => {
        const page: PageFromComments = {
            title: "",
            description: "",
        }

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
                            page.title = tag.description;
                            pageTitleFound = true;
                        }
                    } else if (tag.name === "Description") {
                        if (tag.description.length > 0) {
                            page.description = tag.description;
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
                return Result.ok(page);
            }
        }
        
        return Result.fail("Invalid Page Comment Detection", "No comment dedicated for the web page itself");
    }


    /**
     * Identify each component within the page. All data of the page are represented as the components.
     * @returns {Result<AraPage>}
     */
    static identifyComponents = async (_page: AraPage, _uiContent: ModuleParts, _code: Code): Promise<Result<AraPage>> => {
        return Result.errorCode501(["UI Level", "Page Level"], "identifyComponents")
        // for (let componentNode of uiContent.elements!) {
        //     const identificationResult = await identifyComponent(page, uiContent, componentNode)
        //     if (identificationResult.isFailure) {
        //         const err = Debug.error(
        //             `this.identifyComponent(componentNode: ${componentName(componentNode)}): ${identificationResult.errorTitle}`, 
        //              identificationResult.errorDescription!,
        //             componentNode,
        //         )    
                
        //         return Result.fail(err)
        //     }
            
        //     const identifiedComponent = identificationResult.getValue();
                
        //         // Let's detect the ComponentType
        //         if (identifiedComponent.id === ComponentIdentity.Undeclared) {
        //             return Result.fail(`code.identifyComponent(componentNode='${componentName(componentNode)}'): error`, 'The component type is not supported by Ara Web')
        //         } else if (identifiedComponent.id === ComponentIdentity.Component || 
        //             identifiedComponent.id === ComponentIdentity.Expression) {
        //             pageTraits.page.metaComponents?.push(identifiedComponent);
        //             continue;
        //         } else if (identifiedComponent.id === ComponentIdentity.Rpc) {
        //             if (pageTraits.page.rpcs === undefined) {
        //                 pageTraits.page.rpcs = {};
        //             }
        //             const componentData = identifiedComponent as RpcCallType;
        //             if (componentData.rpcType === RpcType.Extension) {
        //                 if (pageTraits.page.rpcs.extension === undefined) {
        //                     pageTraits.page.rpcs.extension = [];
        //                 }
        //                 pageTraits.page.rpcs.extension.push(componentData)
        //             } else if (componentData.rpcType === RpcType.Independent) {
        //                 if (pageTraits.page.rpcs.independent === undefined) {
        //                     pageTraits.page.rpcs.independent = [];
        //                 }
        //                 pageTraits.page.rpcs.independent.push(componentData)
        //             } else if (componentData.rpcType === RpcType.Proxy) {
        //                 if (pageTraits.page.rpcs.proxy === undefined) {
        //                     pageTraits.page.rpcs.proxy = [];
        //                 }
        //                 pageTraits.page.rpcs.proxy.push(componentData)
        //             }
        //             continue;
        //         } else if (identifiedComponent.id === ComponentIdentity.Layout) {
        //             const identificationResult = await identifyLayoutComponents(pageTraits, componentNode);
        //             if (identificationResult.isFailure) {
        //                 return Result.fail(
        //                     `this.identifyLayoutComponents(componentNode='${componentName(componentNode)}'): ${identificationResult.errorTitle}`,
        //                     identificationResult.errorDescription!
        //                 )
        //             }
        //             continue;
        //         } else {
        //             console.log(`Component ${componentName(componentNode)} was not identified. It's neither Layout, nor Component nor RPC Call`);
        //         }
        // }
        // return Result.ok(pageTraits.page)
    }
}