/**
 * Testing the Reflect itself
 */
import { ModuleCategory } from "../src/module.js";
import { ModuleCategory as BuiltinModuleCategory } from "../src/reflect-nodejs-ext/index.js";
import { Reflect } from "../src/reflect.js"
import { expect, test } from "vitest";
import { getCategorizedModuleAmount, getImportRecords as getSampleModuleData, getSamplePackage, getSamplePackageWithSubModules } from "./shared.js";
import { DOCUMENT_SELECTOR, ModuleLink } from "@ara-web/sds";
import { MODULE_MEMORY_TAG } from "../src/reflect-object-tree.js";

const reflectingPkgUrl = ModuleLink.newPackageURL("@ara-web", "var-declaration-test")

test('Simply creating a reflect and trying to fetch data', async () => {
    const reflect = new Reflect({packageLink: reflectingPkgUrl})
    const data = await reflect.rest.getAll!(`.${ModuleCategory.Untracked}`);
    expect(data).toHaveLength(0);

    const builtIn = await reflect.rest.getAll!(`.${BuiltinModuleCategory.NodeJsModule}`);
    expect(builtIn).toHaveLength(0);

    const allData = await reflect.rest.getAll!('*');
    expect(allData).toHaveLength(2);
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
    let builtIn = await reflect.rest.getAll!(`.${BuiltinModuleCategory.NodeJsModule}`);
    expect(builtIn).toHaveLength(0);

    // After adding the records
    const posted = await reflect.nodeJsExt.putModules(categorizedModules);
    expect(posted.isSuccess).toBe(true);
    expect(reflect.nodeJsExt.untrackedModuleAmount).toEqual(posted.getValue().length)

    builtIn = await reflect.rest.getAll!(`.${BuiltinModuleCategory.NodeJsModule}`);
    expect(reflect.nodeJsExt.untrackedModuleAmount).toEqual(0)
    expect(builtIn).toHaveLength(getCategorizedModuleAmount());
});

test('Post packages into the Nodejs Reflect Extension', async () => {
    const samplePackage = getSamplePackage();

    const reflect = new Reflect({packageLink: reflectingPkgUrl})
    let builtIn = await reflect.rest.getAll!(`${MODULE_MEMORY_TAG}.${BuiltinModuleCategory.NodeJsModule}`);
    expect(builtIn).toHaveLength(0);

    // After adding the records
    const posted = await reflect.nodeJsExt.putPackage(samplePackage);
    expect(posted.isSuccess).toBe(true);

    builtIn = await reflect.rest.getAll!(`${MODULE_MEMORY_TAG}.${BuiltinModuleCategory.NodeJsModule}`);
    expect(builtIn).toHaveLength(1);
});


test('Setup auto import and make sure its automatically imported', async () => {
    const reflect = new Reflect({packageLink: reflectingPkgUrl})
    // Has no data yet, so empty
    let builtIn = await reflect.rest.getAll!(`${MODULE_MEMORY_TAG}.${BuiltinModuleCategory.NodeJsModule}`);
    expect(builtIn).toHaveLength(0);
 
    // After adding the records
    reflect.nodeJsExt.watchModules(getSampleModuleData);

    builtIn = await reflect.rest.getAll!(`${MODULE_MEMORY_TAG}.${BuiltinModuleCategory.NodeJsModule}`);
    expect(builtIn).toHaveLength(getCategorizedModuleAmount());
});


test('Post packages into the Nodejs Reflect Extension and getting submodule of the package', async () => {
    const samplePackage = getSamplePackageWithSubModules();

    const reflect = new Reflect({packageLink: reflectingPkgUrl})
    let builtIn = await reflect.rest.getAll!(`${MODULE_MEMORY_TAG}.${BuiltinModuleCategory.NodeJsModule}`);
    expect(builtIn !== null).toBe(true);
    expect(builtIn).toHaveLength(0);

    // After adding the records
    const posted = await reflect.nodeJsExt.putPackage(samplePackage);
    expect(posted.isSuccess).toBe(true);

    const foundPkg = reflect.nodeJsExt.getModule(ModuleLink.newPackageURLFromImportClause("@ara-web/p-hintjens"));
    expect(foundPkg.isSuccess).toBe(true);

    builtIn = await reflect.rest.getAll!(`*`);
    expect(builtIn !== null).toBe(true);
    expect(builtIn).toHaveLength(3);
    expect(builtIn[0].selector).toEqual(DOCUMENT_SELECTOR);
    expect(builtIn[1].selector.indexOf('memop') > -1).toBe(true);
    expect(builtIn[2].selector.indexOf('module') > -1).toBe(true);
});
