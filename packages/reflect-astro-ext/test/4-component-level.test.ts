/**
 * Testing the functions for the setup of the plugin into the website,
 * which means setting up shared modules.
 */

import { expect, test } from "vitest";
// import { ModuleMemory } from "@ara-web/reflect";
// import { ModuleCategory, ModulePartitioner, CodeLevel, PageLevel, type Page, FileExtension, Component, ModuleIdentifier, Asset, Script } from "../src";
import { getImportRecords, getNewAstroReflect, getNewProjectMemory } from "./shared";
import { CodeLevel, FileExtension, ModuleCategory, ModulePartitioner, Page } from "../src";
// import { Debug } from "@ara-web/p-hintjens";

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
        if (moduleMemory.moduleCategory !== ModuleCategory.Component &&
            moduleMemory.moduleCategory !== ModuleCategory.Layout &&
            moduleMemory.moduleCategory !== ModuleCategory.Page) {
            continue;
        }
        const moduleParts = await ModulePartitioner.partition(moduleMemory);
        expect(moduleParts.isSuccess).toBe(true);
    
        if (moduleParts.getValue().fileExtension !== FileExtension.Astro) {
            continue;
        } 
        if (moduleMemory.moduleCategory !== ModuleCategory.Page) {
            continue;
        }
        const identifiedSourceCode = await CodeLevel.identifySourceCode<Page>(moduleParts.getValue().source, moduleMemory as ModuleMemory<Page>, projectMemory);
        expect(identifiedSourceCode.isSuccess).toBe(true);
        // Uncomment to see the object links.
    //     const page = await PageLevel.identify<Page>(moduleParts.getValue(), identifiedSourceCode.getValue());
    //     Debug.log(`Identified ${moduleMemory.moduleLink}: (in future use p-hintjens/ObjectLink.selectorParse(memory))`)
    //     Debug.log(page);
    //     expect(page.isSuccess).toBe(true);
    //     Debug.log(`The page ${page.getValue().title} has ${page.getValue().slots["default"].length} children:`)
    //     Debug.log(page.getValue().slots["default"])
    //     const child = page.getValue().slots["default"][0] as Component;
    //     for (let subChild of child.slots["default"]) {
    //         Debug.log(`The sub child:`)
    //         Debug.log(subChild.link.toString())
    //         if ("slots" in subChild && subChild.slots["default"].length > 0) {
    //             Debug.log(`The sub child has ${subChild.slots["default"].length} children:`)
    //             Debug.log(subChild.slots["default"].map((child) => child.link.toString()))
    //         }
    //     }
    }
})
