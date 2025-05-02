/**
 * Testing the functions for the setup of the plugin into the website,
 * which means setting up shared modules.
 */

import { expect, test } from "vitest";
import { ModuleMemory } from "@ara-web/reflect";
import { ModuleCategory, ModulePartitioner, CodeLevel, PageLevel, type Page, FileExtension, Component, ModuleIdentifier, Asset, Script } from "../src";
import { getImportRecords, getNewAstroReflect, getNewProjectMemory } from "./shared";
import { Debug } from "@ara-web/ts-enhancement";

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
        // Debug.log(`Identified page:`)
        // Debug.log(page);
        expect(page.isSuccess).toBe(true);
        // Debug.log(`The page ${page.getValue().title} has ${page.getValue().slots["default"].length} children:`)
        // Debug.log(page.getValue().slots["default"])
        // const child = page.getValue().slots["default"][0] as Component;
        // for (let subChild of child.slots["default"]) {
            // Debug.log(`The sub child:`)
            // Debug.log(subChild)
        // }
    }
})

// TODO make sure that page content is updated in the reflect.beforeGet() before fetching.
test(`Make sure the that pages JSON are automatically updated`, async () => {
    const reflectExtension = await getNewAstroReflect();
    reflectExtension.watchModules(getImportRecords);
    // Make sure they are all no content moduled
    const projectMemory = getNewProjectMemory(reflectExtension);
    expect(reflectExtension.beforeGet !== undefined).toBe(true);
    const beforeGet = await reflectExtension.beforeGet!(ModuleCategory.Page, projectMemory);
    expect(beforeGet.isSuccess).toBe(true);
    
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
        // Debug.log(`Identified page from the pages list:`)
        // Debug.log(page);
        expect(page.isSuccess).toBe(true);
        // Debug.log(`The page ${page.getValue().title} has ${page.getValue().slots["default"].length} children:`)
        // Debug.log(page.getValue().slots["default"])
        // const child = page.getValue().slots["default"][0] as Component;
        // for (let subChild of child.slots["default"]) {
            // Debug.log(`The sub child:`)
            // Debug.log(subChild)
        // }
    }
})

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
        const identifiedModule = await PageLevel.identify<Page>(moduleParts.getValue(), identifiedSourceCode.getValue());
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
        layoutFound = true;
        const identifiedSourceCode = await CodeLevel.identifySourceCode<Page>(moduleParts.getValue().source, moduleMemory as ModuleMemory<Page>, projectMemory);
        expect(identifiedSourceCode.isSuccess).toBe(true);
        const identifiedModule = await PageLevel.identify<Page>(moduleParts.getValue(), identifiedSourceCode.getValue());
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
        const identifiedModule = await ModuleIdentifier.identify<Script>(moduleParts.getValue(), moduleMemory as ModuleMemory<Script>);
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
        const identifiedModule = await ModuleIdentifier.identify<Asset>(moduleParts.getValue(), moduleMemory as ModuleMemory<Asset>);
        expect(identifiedModule.isSuccess).toBe(true);
    }
    expect(assetFound).toBe(true);
});

