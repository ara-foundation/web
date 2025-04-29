/**
 * Testing the functions for the setup of the plugin into the website,
 * which means setting up shared modules.
 */

import { expect, test } from "vitest";
import { ModuleCategory, ModuleIdentifier, ModulePartitioner } from "#module";
import { Asset, FileExtension, Script } from "#ontology";
import { getImportRecords, getNewAstroReflect, getNewProjectMemory } from "./shared";
import { CodeLevel } from "../src/parts/code-level/CodeLevel";
import { Component, Layout } from "#ontology";
import { ModuleMemory } from "@ara-web/reflect/memory";
import { ComponentLevel } from "../src/parts/ui-level/component-level";

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
        const identifiedModule = await ComponentLevel.identify<Component>(moduleParts.getValue(), identifiedSourceCode.getValue());
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
        const identifiedModule = await ComponentLevel.identify<Layout>(moduleParts.getValue(), identifiedSourceCode.getValue());
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

test(`Make sure the that assets are generated`, async () => {
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

