/**
 * Testing the functions for the setup of the plugin into the website,
 * which means setting up shared modules.
 */

import { expect, test } from "vitest";
import { ModuleCategory, ModulePartitioner } from "#module";
import { getImportRecords, getNewAstroReflect, getNewProjectMemory } from "./shared";
import { CodeLevel } from "../src/parts/code-level/CodeLevel";
import { PageLevel } from "../src/parts/ui-level/page-level";
import { type Page, FileExtension } from "#ontology";
import { ModuleMemory } from "@ara-web/reflect/memory";

test(`Make sure the that pages JSON are generated`, async () => {
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
    
        if (moduleParts.getValue().fileExtension !== FileExtension.Astro) {
            continue;
        } 
        if (moduleMemory.moduleCategory !== ModuleCategory.Page) {
            continue;
        }
        const identifiedSourceCode = await CodeLevel.identifySourceCode<Page>(moduleParts.getValue().source, moduleMemory as ModuleMemory<Page>, projectMemory);
        expect(identifiedSourceCode.isSuccess).toBe(true);

        const page = await PageLevel.identify<Page>(moduleParts.getValue(), identifiedSourceCode.getValue());
        expect(page.isSuccess).toBe(true);
    }
})

// TODO make sure that page content is updated in the reflect.beforeGet() before fetching.