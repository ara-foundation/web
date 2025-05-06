/**
 * Testing the functions for the setup of the plugin into the website,
 * which means setting up shared modules.
 */

import { expect, test } from "vitest";
import { getImportRecords, getNewAstroReflect, getNewProjectMemory } from "./shared";
import { CodeLevel, Component, FileExtension, ModuleCategory, ModulePartitioner, Page, PageLevel } from "../src";
import { Debug } from "@ara-web/p-hintjens";
import { ModuleMemory } from "@ara-web/reflect";

test(`Make sure the that object links are correct`, async () => {
    const modules = getImportRecords()
      
    const reflectExtension = await getNewAstroReflect();
    const validated = await reflectExtension.putModules(modules);
    expect(validated.isSuccess).toBe(true);
    // Make sure they are all no content moduled
    const projectMemory = getNewProjectMemory(reflectExtension);
    
    const moduleMemories = projectMemory.getModules();
    expect(Object.keys(moduleMemories).length).toBeGreaterThan(0);
    for (let moduleMemory of moduleMemories) {
        if (!([
                ModuleCategory.Component, 
                ModuleCategory.Layout,
                ModuleCategory.Page
            ].includes(moduleMemory.moduleCategory as ModuleCategory))) {
            continue;
        }
        const moduleParts = await ModulePartitioner.partition(moduleMemory);
        expect(moduleParts.isSuccess).toBe(true);
    
        if (moduleParts.getValue().fileExtension !== FileExtension.Astro) {
            continue;
        } 
        // Only Component
        if (moduleMemory.moduleCategory !== ModuleCategory.Component) {
            continue;
        }
        const identifiedSourceCode = await CodeLevel.identifySourceCode<Page>(moduleParts.getValue().source, moduleMemory as ModuleMemory<Page>, projectMemory);
        expect(identifiedSourceCode.isSuccess).toBe(true);
        // Test by using ObjectLinkSelector.
        // Uncomment to see the object links.
        const page = await PageLevel.identify<Page>(moduleParts.getValue(), identifiedSourceCode.getValue(), projectMemory);
        expect(page.isSuccess).toBe(true);
        Debug.log(`The page ${page.getValue().title} has ${page.getValue().slots["default"].length} children:`)
        const child = page.getValue().slots["default"][0] as Component;
        expect(child.link.getId()).toBe("container");
        for (let subChild of child.slots["default"]) {
            Debug.log(`The child ${child.link.selector} with id '${child.link.getId()}' > sub ${subChild.link.selector} as ${subChild.link.getId() === "container"}`)
            if (subChild.link.getId() === 'background') {
                Debug.log(`\tsubchild ${subChild.link.getId()} as ${subChild.link.selector}`)
                Debug.log(`\t\tThe background child entered`)
                const img = subChild as Component;
                expect(img.attributes["src"]).toBeDefined();
                Debug.log(`\t\tThe image ${img.attributes["src"]} is defined ${img.attributes["src"]}:`)
                Debug.log(img.attributes["src"])
                break;
            }
        }
    }
})

test(`Make sure that slots are attributed`, async () => {
    const modules = getImportRecords()
      
    const reflectExtension = await getNewAstroReflect();
    const validated = await reflectExtension.putModules(modules);
    expect(validated.isSuccess).toBe(true);
    // Make sure they are all no content moduled
    const projectMemory = getNewProjectMemory(reflectExtension);
    
    const moduleMemories = projectMemory.getModules();
    expect(Object.keys(moduleMemories).length).toBeGreaterThan(0);
    for (let moduleMemory of moduleMemories) {
        if (!([
                ModuleCategory.Component, 
                ModuleCategory.Layout,
                ModuleCategory.Page
            ].includes(moduleMemory.moduleCategory as ModuleCategory))) {
            continue;
        }
        const moduleParts = await ModulePartitioner.partition(moduleMemory);
        expect(moduleParts.isSuccess).toBe(true);
    
        if (moduleParts.getValue().fileExtension !== FileExtension.Astro) {
            continue;
        } 
        // Only Component
        if (moduleMemory.moduleCategory !== ModuleCategory.Page) {
            continue;
        }
        const identifiedSourceCode = await CodeLevel.identifySourceCode<Page>(moduleParts.getValue().source, moduleMemory as ModuleMemory<Page>, projectMemory);
        expect(identifiedSourceCode.isSuccess).toBe(true);
        // Test by using ObjectLinkSelector.
        // Uncomment to see the object links.
        const page = await PageLevel.identify<Page>(moduleParts.getValue(), identifiedSourceCode.getValue(), projectMemory);
        expect(page.isSuccess).toBe(true);
        Debug.log(`The page ${page.getValue().title} has ${page.getValue().slots["default"].length} children:`)
        const layout = page.getValue().slots["default"][0] as Component;
        const slotNames = Object.keys(layout.slots);
        expect(slotNames.length).toBe(3);
        
        expect(slotNames[0]).toBe("default");
        expect(slotNames[1]).toBe("content-left");
        expect(slotNames[2]).toBe("content-right");
        
        expect(layout.slots[slotNames[0]].length).toBeGreaterThan(0);
        expect(layout.slots[slotNames[1]].length).toBeGreaterThan(0);
        expect(layout.slots[slotNames[2]].length).toBeGreaterThan(0);
    }
})
