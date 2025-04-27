/**
 * Testing the functions for the setup of the plugin into the website,
 * which means setting up shared modules.
 */

import { expect, test } from "vitest";
import { ReflectExtension } from "../src/ReflectExtension";
import { FileExtension, ModulePartitioner } from "../src/module";
import { Debug } from "@ara-web/ts-enhancement";
import { getImportRecords, getNewProjectMemory, welcomeComponentPath } from "./shared";
import { ModuleURL } from "@ara-web/reflect/ara-link";

test(`Make sure the module parts are importing`, async () => {
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
        const moduleParts = await ModulePartitioner.partition(moduleMemories[moduleURL]);
        expect(moduleParts.isSuccess).toBe(true);

        if (moduleParts.getValue().fileExtension === FileExtension.Astro) {
            expect(moduleParts.getValue().elements?.length).toBeGreaterThan(0);
        } else {
            expect(moduleParts.getValue().elements).toBeUndefined();
            expect(moduleParts.getValue().source).toBeUndefined();
        }
    }

    let noContentModules = projectMemory.getNoContentModules<unknown>();
    expect(noContentModules[welcomeComponentPath] !== undefined).toBe(true);
})