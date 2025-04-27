/**
 * Testing the Reflect itself
 */
import { Debug } from "@ara-web/ts-enhancement";
import { ModuleCategory } from "../src/module.js";
import { ModuleCategory as BuiltinModuleCategory } from "../src/reflect-nodejs-ext/module.js";
import { Reflect } from "../src/Reflect.js"
import { expect, test } from "vitest";
import { getCategorizedModuleAmount, getCategorizedModuleData, getImportRecords } from "./shared.js";

test('Simply creating a reflect and trying to fetch data', async () => {
    const reflect = new Reflect();
    const data = await reflect.get<unknown>(ModuleCategory.Untracked);
    expect(data.isSuccess).toBe(true);
    expect(data.getValue()).toHaveLength(0);

    const builtIn = await reflect.get<unknown>(BuiltinModuleCategory.NodeJsModule);
    expect(builtIn.isSuccess).toBe(true);
    expect(builtIn.getValue()).toHaveLength(0);
});

/**************************************************************
 * 
 * SETUP
 * Module registration testing
 * 
 **************************************************************/

test('Post categorized modules into the Reflect', async () => {
    const categorizedModules = getCategorizedModuleData();

    const reflect = new Reflect();
    let builtIn = await reflect.get<unknown>(BuiltinModuleCategory.NodeJsModule);
    expect(builtIn.isSuccess).toBe(true);
    expect(builtIn.getValue()).toHaveLength(0);
    // After adding the records
    const posted = reflect.postModules(categorizedModules);
    expect(posted.isSuccess).toBe(true);

    builtIn = await reflect.get<unknown>(BuiltinModuleCategory.NodeJsModule);
    expect(builtIn.isSuccess).toBe(true);
    expect(builtIn.getValue()).toHaveLength(getCategorizedModuleAmount());
});

test('Setup auto import and make sure its automatically imported', async () => {
    const reflect = new Reflect();
    // Has no data yet, so empty
    let builtIn = await reflect.get<unknown>(BuiltinModuleCategory.NodeJsModule);
    expect(builtIn.isSuccess).toBe(true);
    expect(builtIn.getValue()).toHaveLength(0);
 
    // After adding the records
    reflect.postAutoImporter(getCategorizedModuleData);

    builtIn = await reflect.get<unknown>(BuiltinModuleCategory.NodeJsModule);
    expect(builtIn.isSuccess).toBe(true);
    expect(builtIn.getValue()).toHaveLength(getCategorizedModuleAmount());
});

test(`Setup auto import extension`, async () => {
    const reflect = new Reflect();
    // Has no data yet, so empty
    let builtIn = await reflect.get<unknown>(BuiltinModuleCategory.NodeJsModule);
    expect(builtIn.isSuccess).toBe(true);
    expect(builtIn.getValue()).toHaveLength(0);
 
    reflect.postAutoImporter({recordsGetter: getImportRecords, categorizer: reflect.nodeJsExt})
    expect(builtIn.isSuccess).toBe(true);
    expect(builtIn.getValue()).toHaveLength(0);

    // Now let's attempt to load
    const modules = getCategorizedModuleData();
    builtIn = await reflect.get<unknown>(BuiltinModuleCategory.NodeJsModule);
    expect(builtIn.isSuccess).toBe(true);
    expect(builtIn.getValue()).toHaveLength(getCategorizedModuleAmount())
    for (let moduleData of Object.values(modules[BuiltinModuleCategory.NodeJsModule])) {
        expect(builtIn.getValue().includes(moduleData.glob)).toBe(true);
    }
});