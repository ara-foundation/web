/**
 * Testing the Reflect itself
 */
import { ModuleCategory } from "../src/module.js";
import { ModuleCategory as BuiltinModuleCategory } from "../src/reflect-nodejs-ext/index.js";
import { Reflect } from "../src/reflect.js"
import { expect, test } from "vitest";
import { getCategorizedModuleAmount, getImportRecords as getSampleModuleData, getSamplePackage, getSamplePackageWithSubModules } from "./shared.js";
import { Debug } from "@ara-web/p-hintjens";
import { ModuleLink } from "@ara-web/sds";

const reflectingPkgUrl = ModuleLink.newPackageURL("@ara-web", "var-declaration-test")

test('Simply creating a reflect and trying to fetch data', async () => {
    const reflect = new Reflect({packageLink: reflectingPkgUrl})
    const data = await reflect.get!(ModuleCategory.Untracked);
    expect(data.isSuccess).toBe(true);
    expect(data.getValue()).toHaveLength(0);

    const builtIn = await reflect.get!(BuiltinModuleCategory.NodeJsModule);
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

    const reflect = new Reflect({packageLink: reflectingPkgUrl})
    let builtIn = await reflect.get!(BuiltinModuleCategory.NodeJsModule);
    expect(builtIn.isSuccess).toBe(true);
    expect(builtIn.getValue()).toHaveLength(0);

    // After adding the records
    const posted = await reflect.nodeJsExt.putModules(categorizedModules);
    expect(posted.isSuccess).toBe(true);

    builtIn = await reflect.get!(BuiltinModuleCategory.NodeJsModule);
    expect(builtIn.isSuccess).toBe(true);
    expect(builtIn.getValue()).toHaveLength(getCategorizedModuleAmount());
});

test('Post packages into the Nodejs Reflect Extension', async () => {
    const samplePackage = getSamplePackage();

    const reflect = new Reflect({packageLink: reflectingPkgUrl})
    let builtIn = await reflect.get!(BuiltinModuleCategory.NodeJsModule);
    expect(builtIn.isSuccess).toBe(true);
    expect(builtIn.getValue()).toHaveLength(0);

    // After adding the records
    const posted = await reflect.nodeJsExt.putPackage(samplePackage);
    expect(posted.isSuccess).toBe(true);

    builtIn = await reflect.get!(BuiltinModuleCategory.NodeJsModule);
    expect(builtIn.isSuccess).toBe(true);
    expect(builtIn.getValue()).toHaveLength(1);
});


test('Setup auto import and make sure its automatically imported', async () => {
    const reflect = new Reflect({packageLink: reflectingPkgUrl})
    // Has no data yet, so empty
    let builtIn = await reflect.get!(BuiltinModuleCategory.NodeJsModule);
    expect(builtIn.isSuccess).toBe(true);
    expect(builtIn.getValue()).toHaveLength(0);
 
    // After adding the records
    reflect.nodeJsExt.watchModules(getSampleModuleData);

    builtIn = await reflect.get!(BuiltinModuleCategory.NodeJsModule);
    expect(builtIn.isSuccess).toBe(true);
    expect(builtIn.getValue()).toHaveLength(getCategorizedModuleAmount());
});


test('Post packages into the Nodejs Reflect Extension and getting submodule of the package', async () => {
    const samplePackage = getSamplePackageWithSubModules();

    const reflect = new Reflect({packageLink: reflectingPkgUrl})
    let builtIn = await reflect.get!(BuiltinModuleCategory.NodeJsModule);
    expect(builtIn.isSuccess).toBe(true);
    expect(builtIn.getValue()).toHaveLength(0);

    // After adding the records
    const posted = await reflect.nodeJsExt.putPackage(samplePackage);
    expect(posted.isSuccess).toBe(true);

    const foundPkg = reflect.nodeJsExt.getModule(ModuleLink.newPackageURLFromImportClause("@ara-web/p-hintjens"));
    expect(foundPkg.isSuccess).toBe(true);
});
