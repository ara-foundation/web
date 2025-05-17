/**
 * Testing the functions for the setup of the plugin into the website,
 * which means setting up shared modules.
 */

import { expect, test } from "vitest";
import { ModuleMemory } from "@ara-web/reflect";
import { ModuleCategory, ModulePartitioner, CodeLevel, PageLevel, type Page, FileExtension, ModuleIdentifier, Asset, Module } from "../src";
import { getImportRecords, getNewAstroReflect, getNewProjectMemory } from "./shared";
import { Debug } from "@ara-web/p-hintjens";

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

        const page = await PageLevel.identify<Page>(moduleParts.getValue(), identifiedSourceCode.getValue(), projectMemory);
        expect(page.isSuccess).toBe(true);
    }
})

// test(`Make sure the that pages JSON are automatically updated`, async () => {
//     const reflectExtension = await getNewAstroReflect();
//     reflectExtension.watchModules(getImportRecords);
//     // Make sure they are all no content moduled
//     const projectMemory = getNewProjectMemory(reflectExtension);
//     expect(reflectExtension.beforeGet !== undefined).toBe(true);
//     const beforeGet = await reflectExtension.beforeGet!(ModuleCategory.Page, projectMemory);
//     expect(beforeGet.isSuccess).toBe(true);
    
//     const moduleMemories = projectMemory.getModules();
//     expect(Object.keys(moduleMemories).length).toBeGreaterThan(0);
//     for (let moduleMemory of moduleMemories) {
//         const moduleParts = await ModulePartitioner.partition(moduleMemory);
//         expect(moduleParts.isSuccess).toBe(true);
    
//         if (moduleParts.getValue().fileExtension !== FileExtension.Astro) {
//             continue;
//         } 
//         if (moduleMemory.moduleCategory !== ModuleCategory.Page) {
//             continue;
//         }
//         const identifiedSourceCode = await CodeLevel.identifySourceCode<Page>(moduleParts.getValue().source, moduleMemory as ModuleMemory<Page>, projectMemory);
//         Debug.log(identifiedSourceCode)
//         expect(identifiedSourceCode.isSuccess).toBe(true);

//         const page = await PageLevel.identify<Page>(moduleParts.getValue(), identifiedSourceCode.getValue(), projectMemory);
//         expect(page.isSuccess).toBe(true);
//     }
// })

test(`Make sure the that components are generated`, async () => {
    const modules = getImportRecords()
          
    const reflectExtension = await getNewAstroReflect();
    const validated = await reflectExtension.putModules(modules);
    expect(validated.isSuccess).toBe(true);
    // Make sure they are all no content moduled
    const projectMemory = getNewProjectMemory(reflectExtension);
        
    const moduleMemories = projectMemory.getModules();
    expect(Object.keys(moduleMemories).length).toBeGreaterThan(0);
    let componentFound = false;
    for (let moduleMemory of moduleMemories) {
        if (moduleMemory.moduleLink.toFilePath.indexOf("Welcome.astro") === -1) {
            continue;
        }
        const moduleParts = await ModulePartitioner.partition(moduleMemory);
        expect(moduleParts.isSuccess).toBe(true);
        
        if (moduleParts.getValue().fileExtension !== FileExtension.Astro) {
            continue;
        } 
        if (moduleMemory.moduleCategory !== ModuleCategory.Component) {
            continue;
        }
        componentFound = true;
        const identifiedSourceCode = await CodeLevel.identifySourceCode<Page>(moduleParts.getValue().source, moduleMemory as ModuleMemory<Page>, projectMemory);
        expect(identifiedSourceCode.isSuccess).toBe(true);
        const identifiedModule = await PageLevel.identify<Page>(moduleParts.getValue(), identifiedSourceCode.getValue(), projectMemory);
        expect(identifiedModule.isSuccess).toBe(true);
    }
    expect(componentFound).toBe(true);
});

test(`Make sure the that layouts are generated`, async () => {
    const modules = getImportRecords()
          
    const reflectExtension = await getNewAstroReflect();
    const validated = await reflectExtension.putModules(modules);
    expect(validated.isSuccess).toBe(true);
    // Make sure they are all no content moduled
    const projectMemory = getNewProjectMemory(reflectExtension);
        
    const moduleMemories = projectMemory.getModules();
    expect(Object.keys(moduleMemories).length).toBeGreaterThan(0);
    let layoutFound = false;
    for (let moduleMemory of moduleMemories) {
        const moduleParts = await ModulePartitioner.partition(moduleMemory);
        expect(moduleParts.isSuccess).toBe(true);
        
        if (moduleParts.getValue().fileExtension !== FileExtension.Astro) {
            continue;
        } 
        if (moduleMemory.moduleCategory !== ModuleCategory.Layout) {
            continue;
        }
        if (reflectExtension.beforeGet !== undefined) {
            const posted = await reflectExtension.beforeGet(moduleMemory.moduleCategory, projectMemory);
            if (posted.isFailure) {
                Debug.log(`beforeGet() failed: ${posted.errorTitle}`);
                Debug.log(posted.errorDescription);
                return;
            }
            expect(posted.isSuccess).toBe(true);
        }
        layoutFound = true;
        const identifiedSourceCode = await CodeLevel.identifySourceCode<Page>(moduleParts.getValue().source, moduleMemory as ModuleMemory<Page>, projectMemory);
        expect(identifiedSourceCode.isSuccess).toBe(true);
        const identifiedModule = await PageLevel.identify<Page>(moduleParts.getValue(), identifiedSourceCode.getValue(), projectMemory);
        expect(identifiedModule.isSuccess).toBe(true);
    }
    expect(layoutFound).toBe(true);
});

test(`Make sure the that scripts are generated`, async () => {
    const modules = getImportRecords()
          
    const reflectExtension = await getNewAstroReflect();
    const validated = await reflectExtension.putModules(modules);
    expect(validated.isSuccess).toBe(true);
    // Make sure they are all no content moduled
    const projectMemory = getNewProjectMemory(reflectExtension);
        
    const moduleMemories = projectMemory.getModules();
    expect(Object.keys(moduleMemories).length).toBeGreaterThan(0);
    let scriptFound = false;
    for (let moduleMemory of moduleMemories) {
        const moduleParts = await ModulePartitioner.partition(moduleMemory);
        expect(moduleParts.isSuccess).toBe(true);
        
        const extension = moduleParts.getValue().fileExtension
        if (!ModuleIdentifier.isScript(extension)) {
            continue;
        }

        scriptFound = true;
        const identifiedModule = await ModuleIdentifier.identify<Module>(moduleParts.getValue(), moduleMemory as ModuleMemory<Module>, projectMemory);
        expect(identifiedModule.isSuccess).toBe(true);
    }
    expect(scriptFound).toBe(true);
});

test(`Make sure that the assets are generated`, async () => {
    const modules = getImportRecords()
          
    const reflectExtension = await getNewAstroReflect();
    const validated = await reflectExtension.putModules(modules);
    expect(validated.isSuccess).toBe(true);
    // Make sure they are all no content moduled
    const projectMemory = getNewProjectMemory(reflectExtension);
        
    const moduleMemories = projectMemory.getModules();
    expect(Object.keys(moduleMemories).length).toBeGreaterThan(0);
    let assetFound = false;
    for (let moduleMemory of moduleMemories) {
        const moduleParts = await ModulePartitioner.partition(moduleMemory);
        expect(moduleParts.isSuccess).toBe(true);
        
        const extension = moduleParts.getValue().fileExtension
        if (!ModuleIdentifier.isAsset(extension)) {
            continue;
        }

        assetFound = true;
        const identifiedModule = await ModuleIdentifier.identify<Asset>(moduleParts.getValue(), moduleMemory as ModuleMemory<Asset>, projectMemory);
        expect(identifiedModule.isSuccess).toBe(true);
    }
    expect(assetFound).toBe(true);
});

