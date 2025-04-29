/**
 * Testing the functions for the setup of the plugin into the website,
 * which means setting up shared modules.
 */

import { expect, test } from "vitest";
import { ModuleCategory, ModulePartitioner } from "#module";
import { FileExtension } from "#ontology";
import { getImportRecords, getNewAstroReflect, getNewProjectMemory } from "./shared";
import { CodeLevel } from "../src/parts/code-level/CodeLevel";
import { Component, Layout } from "#ontology";
import { ModuleMemory } from "@ara-web/reflect/memory";
import { ComponentLevel } from "../src/parts/ui-level/component-level";
import { Debug } from "@ara-web/ts-enhancement/debug";

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
        const identifiedSourceCode = await CodeLevel.identifySourceCode<Component>(moduleParts.getValue().source, moduleMemory as ModuleMemory<Component>, projectMemory);
        expect(identifiedSourceCode.isSuccess).toBe(true);
        const identifiedModule = await ComponentLevel.identifyComponent(moduleParts.getValue(), identifiedSourceCode.getValue());
        Debug.log(`Identified source code of the component ${moduleMemory.moduleLink.moduleURL}`)
        Debug.log(identifiedModule)
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
        const identifiedSourceCode = await CodeLevel.identifySourceCode<Layout>(moduleParts.getValue().source, moduleMemory as ModuleMemory<Layout>, projectMemory);
        expect(identifiedSourceCode.isSuccess).toBe(true);
        const identifiedModule = await ComponentLevel.identifyLayout(moduleParts.getValue(), identifiedSourceCode.getValue());
        Debug.log(`Identified source code of the layout ${moduleMemory.moduleLink.moduleURL}`)
        Debug.log(identifiedModule)
        expect(identifiedModule.isSuccess).toBe(true);
    }
    expect(layoutFound).toBe(true);
});
