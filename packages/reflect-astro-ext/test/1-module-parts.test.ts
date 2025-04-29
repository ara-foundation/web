// /**
//  * Testing the functions for the setup of the plugin into the website,
//  * which means setting up shared modules.
//  */

import { expect, test } from "vitest";
import { ModulePartitioner } from "#module";
import { FileExtension } from "#ontology";
import { getImportRecords, getNewAstroReflect, getNewProjectMemory } from "./shared";

test(`Make sure the module parts are importing`, async () => {
    const modules = getImportRecords()
  
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

        if (moduleParts.getValue().source?.length === 0) 
        if (moduleParts.getValue().fileExtension === FileExtension.Astro) {
            expect(moduleParts.getValue().elements?.length).toBeGreaterThan(0);
        }
    }

    let welcomeComponent = projectMemory.getModule<unknown>('src/components/Welcome.astro');
    expect(welcomeComponent.isSuccess).toBe(true);
})