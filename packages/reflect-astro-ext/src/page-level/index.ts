import { OkResult, Result, ObjectTraits, Debug, ObjectLink } from "@ara-web/p-hintjens";
import type { ModuleMemory } from "@ara-web/reflect";
import {
    FileExtension, 
    type ModuleParts, 
    type OntologoicalIdentifier,
    type Page, 
    type Slots,
    ComponentLevel,
    CodeLevel,
    type SlotElement,
    type WalkFilter
} from "../index.js";
import { ProjectMemory } from "@ara-web/reflect";
export { PageObjectNode } from "./page-object-node.js";
export { PageObjectAdapter, pageToObjectNodes } from "./page-object-adapter.js";

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
    public static identify = async <T>(parts: ModuleParts, rawMemory: ModuleMemory<T>, projectMemory: ProjectMemory): Promise<Result<T>> => {
        const validated = this.validateModuleParts(parts);
        if (validated.isFailure) {
            return Result.fail(`this.validateParts(): ${validated.errorTitle}`, validated.errorDescription!)
        }
                
        const meta = CodeLevel.identifyMeta(parts.source!);

        const memory = rawMemory as ModuleMemory<Page>
        const slots = await this.identifySlots(parts, memory, projectMemory);
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
     * Identify each component within the page. All data of the page are represented as the components.
     * @returns {Result<AraPage>}
     */
    private static identifySlots = async (uiContent: ModuleParts, memory: ModuleMemory<Page>, projectMemory: ProjectMemory): Promise<Result<Slots>> => {
        const slots: Slots = {};
        const emptyObjLink = new ObjectLink(memory.moduleLink);
        for (const componentNode of uiContent.elements!) {
            if (componentNode.isText && componentNode.value.length === 0) {
                continue;
            }
            const identificationResult = await ComponentLevel.identifyAstroNode(uiContent, memory, componentNode, emptyObjLink, projectMemory)
            if (identificationResult.isFailure) {
                const err = Debug.error(
                    `ComponentLevel.identifyAstroNode(): ${identificationResult.errorTitle}`, 
                    identificationResult.errorDescription!,
                    componentNode,
                )    
                
                return Result.fail(err)
            }

            const linted = await ComponentLevel.lintAttributes(identificationResult.getValue(), memory, projectMemory);
            if (linted.isFailure) {
                return Result.fail(
                    `ComponentLevel.lintAttributes(): ${linted.errorTitle}`,
                    linted.errorDescription!
                )
            }

            const slot = ComponentLevel.identifySlotName(linted.getValue());
            if (slots[slot] === undefined) {
                slots[slot] = [];
            }
            slots[slot].push(linted.getValue())
        }
        return Result.ok(slots)
    }

    // Pass the page.slots to walk and find a slot that matches the WalkFilter.
    // TODO: change to use getPageAsObjectTree.
    public static walk = (slots: Slots, walkFilter: WalkFilter): SlotElement|undefined => {
        for (const slotName in slots) {
            const slotElements = slots[slotName];
            for (const slotElementIndex in slotElements) {
                const slotElement = slotElements[slotElementIndex];
                if (walkFilter(slotElement)) {
                    return slotElement;
                } else if ("slots" in slotElement) {
                    const identified = PageLevel.walk(slotElement.slots, walkFilter);
                    if (identified !== undefined) {
                        return identified;
                    }
                }
            }
        }

        return undefined;
    }
}