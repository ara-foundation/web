/**
 * Testing the functions for the setup of the plugin into the website,
 * which means setting up shared modules.
 */

import { expect, test } from "vitest";
import { FilePath, ImportedRecords } from "@ara-web/reflect";
import { ModuleCategory } from "../src";
import { getImportRecords, getNewAstroReflect, getNewProjectMemory } from "./shared";
import { Debug } from "@ara-web/p-hintjens";

test('Simply creating a reflect extension', async () => {
    const reflectExtension = await getNewAstroReflect();
    expect(reflectExtension.description.length).toBeGreaterThan(0)

    const unsupportedModuleCategory = "node_modules";
    const supportedModuleCategory = ModuleCategory.Component;
    expect(false === reflectExtension.isSupportedModuleCategory(unsupportedModuleCategory))
    expect(true === reflectExtension.isSupportedModuleCategory(supportedModuleCategory))
});

test(`Simply testing that path is identified as the category data`, async () => {
    const reflectExtension = await getNewAstroReflect();
    const faviconModulePath = './test-app/public/favicon.svg';
    const invalidRecords: ImportedRecords = {
        records: {
            [faviconModulePath]: undefined
        },
        importMetaFilename: import.meta.dirname
    };
    const invalidated = await reflectExtension.putModules(invalidRecords);
    expect(invalidated.isSuccess).toBe(false);

    const indexAstroPath = "./test-app/src/pages/index.astro";
    const validRecords: ImportedRecords = {
        records: {
            [indexAstroPath]: undefined
        },
        importMetaFilename: import.meta.dirname
    };
    const validated = await reflectExtension.putModules(validRecords);
    expect(validated.isSuccess).toBe(true);
})

test(`Test the categorization of the import.meta.glob`, async () => {
    const modules = getImportRecords()
  
    const reflectExtension = await getNewAstroReflect();
    const validated = await reflectExtension.putModules(modules);
    expect(validated.isSuccess).toBe(true);

    // Make sure they are all no content moduled
    const projectMemory = getNewProjectMemory(reflectExtension);

    const welcomeComponentPath = FilePath.getFileAbsolutePath("./src/components/Welcome.astro", reflectExtension.rootDir);
    const welcomeComponent = projectMemory.getModule<unknown>(welcomeComponentPath);
    expect(welcomeComponent.isSuccess).toBe(true);
})