/**
 * Testing the functions for the setup of the plugin into the website,
 * which means setting up shared modules.
 */

import { expect, test } from "vitest";
import { ReflectExtension } from "../src/ReflectExtension";
import { FileExtension, ModulePartitioner } from "../src/module";
import { getImportRecords, getNewProjectMemory, welcomeComponentPath } from "./shared";
import { ModuleURL } from "@ara-web/reflect/ara-link";
import { Debug } from "@ara-web/ts-enhancement";
import { CodeLevel } from "../src/parts/code-level/CodeLevel";

test(`Make sure the that code is importing`, async () => {
    const modules = getImportRecords()
  
    const reflectExtension = new ReflectExtension();
    const validated = reflectExtension.getCategorizedModuleData(modules);
    expect(validated.isSuccess).toBe(true);
    // Make sure they are all no content moduled
    const projectMemory = getNewProjectMemory(reflectExtension, validated.getValue());

    const moduleMemories = projectMemory.getModuleMemories();
    expect(Object.keys(moduleMemories).length).toBeGreaterThan(0);
    for (let modulePath in moduleMemories) {
        const moduleURL = modulePath as ModuleURL;
        const moduleMemory = moduleMemories[moduleURL];
        const moduleParts = await ModulePartitioner.partition(moduleMemory);
        expect(moduleParts.isSuccess).toBe(true);

        if (moduleParts.getValue().fileExtension !== FileExtension.Astro) {
            Debug.log(`Skipping ${moduleURL} since ${moduleParts.getValue().fileExtension} not supported yet`);
            continue;
        }

        const identifiedSourceCode = await CodeLevel.identifySourceCode(moduleParts.getValue().source, moduleMemory, projectMemory);
        Debug.log(`The identified source code of ${moduleURL}:`)
        Debug.log(identifiedSourceCode);
        expect(identifiedSourceCode.isSuccess).toBe(true);
    }

    let noContentModules = projectMemory.getNoContentModules<unknown>();
    expect(noContentModules[welcomeComponentPath] !== undefined).toBe(true);
})