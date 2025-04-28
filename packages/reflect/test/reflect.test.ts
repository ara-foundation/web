/**
 * Testing the Reflect itself
 */
import { ModuleCategory } from "../src/module.js";
import { ModuleCategory as BuiltinModuleCategory } from "../src/reflect-nodejs-ext/module.js";
import { Reflect } from "../src/Reflect.js"
import { expect, test } from "vitest";
import { getCategorizedModuleAmount, getImportRecords as getSampleModuleData, getSamplePackage } from "./shared.js";
import { Debug } from "@ara-web/ts-enhancement";

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

test('Post modules into the Nodejs Reflect Extension', async () => {
    const categorizedModules = getSampleModuleData();

    const reflect = new Reflect();
    let builtIn = await reflect.get<unknown>(BuiltinModuleCategory.NodeJsModule);
    expect(builtIn.isSuccess).toBe(true);
    expect(builtIn.getValue()).toHaveLength(0);

    // After adding the records
    const posted = await reflect.nodeJsExt.putModules(categorizedModules);
    expect(posted.isSuccess).toBe(true);

    builtIn = await reflect.get<unknown>(BuiltinModuleCategory.NodeJsModule);
    expect(builtIn.isSuccess).toBe(true);
    expect(builtIn.getValue()).toHaveLength(getCategorizedModuleAmount());
});

test('Post packages into the Nodejs Reflect Extension', async () => {
    const samplePackage = getSamplePackage();

    const reflect = new Reflect();
    let builtIn = await reflect.get<unknown>(BuiltinModuleCategory.NodeJsModule);
    expect(builtIn.isSuccess).toBe(true);
    expect(builtIn.getValue()).toHaveLength(0);

    // After adding the records
    const posted = await reflect.nodeJsExt.putPackage(samplePackage);
    expect(posted.isSuccess).toBe(true);

    builtIn = await reflect.get<unknown>(BuiltinModuleCategory.NodeJsModule);
    expect(builtIn.isSuccess).toBe(true);
    expect(builtIn.getValue()).toHaveLength(1);
});


test('Setup auto import and make sure its automatically imported', async () => {
    const reflect = new Reflect();
    // Has no data yet, so empty
    let builtIn = await reflect.get<unknown>(BuiltinModuleCategory.NodeJsModule);
    expect(builtIn.isSuccess).toBe(true);
    expect(builtIn.getValue()).toHaveLength(0);
 
    // After adding the records
    reflect.nodeJsExt.watchModules(getSampleModuleData);

    builtIn = await reflect.get<unknown>(BuiltinModuleCategory.NodeJsModule);
    expect(builtIn.isSuccess).toBe(true);
    expect(builtIn.getValue()).toHaveLength(getCategorizedModuleAmount());
});
