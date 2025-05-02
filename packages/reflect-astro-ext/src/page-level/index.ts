import { parse as commentParse} from "comment-parser";
import { OkResult, Result, ObjectTraits, Debug } from "@ara-web/ts-enhancement";
import type { ModuleMemory } from "@ara-web/reflect";
import {
    FileExtension, 
    type ModuleParts, 
    type OntologoicalIdentifier,
    DEFAULT_SLOT,
    type Page, 
    type Meta, 
    type Slots,
    ComponentLevel
} from "../index.js";

/**
 * Ontologically, `PageLevel` supports translation of modules into `Page` data
 */
@ObjectTraits.staticImplements<OntologoicalIdentifier>()
export class PageLevel {
    
    /**
     * Generates the UI Page from the module `parts` and `memory`.
     * @param {Parts} parts 
     * @returns {Component}
     */
    public static identify = async <T>(parts: ModuleParts, rawMemory: ModuleMemory<T>): Promise<Result<T>> => {
        const validated = this.validateModuleParts(parts);
        if (validated.isFailure) {
            return Result.fail(`this.validateParts(): ${validated.errorTitle}`, validated.errorDescription!)
        }
                
        const meta = this.getMetaFromComment(parts.source!);

        const memory = rawMemory as ModuleMemory<Page>
        const slots = await this.identifySlots(parts, memory);
        if (slots.isFailure) {
            return Result.fail(`this.identifySlots(): ${slots.errorTitle}`, slots.errorDescription);
        }
        
        const page: Page = {
            moduleLink: memory.moduleLink,
            get: memory.glob,
            slots: slots.getValue(),
            fileExtension: parts.fileExtension,
            source: parts.source,
            ...meta
        }

        return Result.ok(page as T);
    }

    private static validateModuleParts = (parts: ModuleParts): OkResult => {
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
     * Extracts the Title, Description from the Page Meta.
     * Returns true if extraction was successful. Otherwise returns false and
     * the error message will be set in the page.title and page.description
     */
    private static getMetaFromComment = (source: string): Meta => {
        const componentMeta: Meta = {
            title: "",
            description: "",
        }

        const parsed = commentParse(source);
        if (parsed.length === 0) {
            return componentMeta;
        }
        
        for (const block of parsed) {
            for (const tag of block.tags) {
                if (tag.tag === "param") {
                    if (tag.type !== "string") {
                        continue;
                    }
                    
                    if (tag.name === "Title") {
                        if (tag.description.length > 0) {
                            componentMeta.title = tag.description;
                        }
                    } else if (tag.name === "Description") {
                        if (tag.description.length > 0) {
                            componentMeta.description = tag.description;
                        }
                    }
                }
            }
        }

        return componentMeta;
    }


    /**
     * Identify each component within the page. All data of the page are represented as the components.
     * @returns {Result<AraPage>}
     */
    private static identifySlots = async (uiContent: ModuleParts, memory: ModuleMemory<Page>): Promise<Result<Slots>> => {
        const slots: Slots = {
            [DEFAULT_SLOT]: []
        };
        for (const componentNode of uiContent.elements!) {
            if (componentNode.isText && componentNode.value.length === 0) {
                continue;
            }
            const identificationResult = await ComponentLevel.identifyAstroNode(uiContent, memory, componentNode)
            if (identificationResult.isFailure) {
                const err = Debug.error(
                    `ComponentLevel.identifyAstroNode(): ${identificationResult.errorTitle}`, 
                     identificationResult.errorDescription!,
                    componentNode,
                )    
                
                return Result.fail(err)
            }
            Debug.log(`Make sure to detect the slots and put the data in accordance in identifySlots() PageLevel`)
            slots[DEFAULT_SLOT].push(identificationResult.getValue())
                
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
        }
        return Result.ok(slots)
    }
}