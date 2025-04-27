/**
 * Testing the functions for the setup of the plugin into the website,
 * which means setting up shared modules.
 */

import { expect, test } from "vitest";
import { ReflectExtension } from "../src/ReflectExtension";
import { ModuleCategory } from "../src/module";
import { Debug } from "@ara-web/ts-enhancement";
import { getImportRecords, getNewProjectMemory, welcomeComponentPath } from "./shared";

test('Simply creating a reflect extension', async () => {
    const reflectExtension = new ReflectExtension();
    expect(reflectExtension.namespace).toEqual("@ara-web");
    expect(reflectExtension.name).toEqual("reflect-astro-ext");
    expect(reflectExtension.label.length).toBeGreaterThan(0)
    expect(reflectExtension.description.length).toBeGreaterThan(0)

    const unsupportedModuleCategory = "node_modules";
    const supportedModuleCategory = ModuleCategory.Component;
    expect(false === reflectExtension.isSupportedModuleCategory(unsupportedModuleCategory))
    expect(true === reflectExtension.isSupportedModuleCategory(supportedModuleCategory))
});

test(`Simply testing that path is identified as the category data`, async () => {
    const reflectExtension = new ReflectExtension();

    const faviconModulePath = './test-app/public/favicon.svg';
    const invalidRecords: Record<string, unknown> = {[faviconModulePath]: undefined};
    const invalidated = reflectExtension.getCategorizedModuleData(invalidRecords);
    expect(invalidated.isSuccess).toBe(false);

    const indexAstroPath = "./src/pages/index.astro";
    const validRecords: Record<string, unknown> = {[indexAstroPath]: undefined};
    const validated = reflectExtension.getCategorizedModuleData(validRecords);
    expect(validated.isSuccess).toBe(true);
})

test(`Test the categorization of the import.meta.glob`, async () => {
    const modules = getImportRecords()
  
    const reflectExtension = new ReflectExtension();
    const validated = reflectExtension.getCategorizedModuleData(modules);
    Debug.log(validated)
    expect(validated.isSuccess).toBe(true);

    // Make sure they are all no content moduled
    const projectMemory = getNewProjectMemory(reflectExtension, validated.getValue());

    let noContentModules = projectMemory.getNoContentModules<unknown>();
    expect(noContentModules[welcomeComponentPath] !== undefined).toBe(true);
})