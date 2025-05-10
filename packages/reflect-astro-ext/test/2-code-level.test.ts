/**
 * Testing the functions for the setup of the plugin into the website,
 * which means setting up shared modules.
 */

import { expect, test } from "vitest";
import { ModulePartitioner, FileExtension, CodeLevel } from "../src";
import { getImportRecords, getNewAstroReflect, getNewProjectMemory } from "./shared";
import { Debug } from "@ara-web/p-hintjens";

test(`Make sure the that code is importing`, async () => {
    const modules = getImportRecords()
    Debug.log(`modules`);
    Debug.log(modules);
      
    const reflectExtension = await getNewAstroReflect();
    const validated = await reflectExtension.putModules(modules);
    expect(validated.isSuccess).toBe(true);
    // Make sure they are all no content moduled
    const projectMemory = getNewProjectMemory(reflectExtension);
    
    const moduleMemories = projectMemory.getModules();
    expect(Object.keys(moduleMemories).length).toBeGreaterThan(0);
    for (let moduleMemory of moduleMemories) {
        const moduleParts = await ModulePartitioner.partition(moduleMemory);
        expect(moduleParts.isSuccess).toBe(true);
    
        if (moduleParts.getValue().fileExtension !== FileExtension.Astro) {
            continue;
        } 
        const identifiedSourceCode = await CodeLevel.identifySourceCode(moduleParts.getValue().source, moduleMemory, projectMemory);
        Debug.log(`identifiedSourceCode`);
        Debug.log(identifiedSourceCode);
        expect(identifiedSourceCode.isSuccess).toBe(true);
    }
})