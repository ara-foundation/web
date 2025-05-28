import { ModuleLink, Restful, ExtensionOperator, Extendable } from "@ara-web/sds";
import { expect } from "vitest";
import { ChiefModuleManager } from "../src/chief-module-manager.js";
import { Module } from "../src/module.js";
import { ModuleRecords, ModuleManager, ModuleRecord } from "../src/module-manager.js";
import { ModuleCategory } from "../src/builtin-module-manager.js";
import { ReflectDataType } from "../src/reflect-object-tree.js";

export const modulePath = `./funcs.ts`;

export const getProjectMemory = (modOps: ModuleManager[]): ChiefModuleManager => {
  const extOp = new ExtensionOperator(modOps);
  const projectMemory = new ChiefModuleManager(extOp)
  return projectMemory;
}

export const getEmptyModule = (filePath: string = import.meta.filename): Module => {
  const fileModuleLink = ModuleLink.newFileLink(filePath);
  const moduleLink = ModuleLink.newPackageLink("reflect", "test", modulePath, {absolutePath: fileModuleLink.url});
  return new Module(ModuleCategory.NodeJsModule, moduleLink, undefined);
}

export const putFuncModule = async (ext: ModuleManager, rest: Restful<ReflectDataType>, _modulePath: string = modulePath): Promise<Extendable> => {
  const glob = await import(_modulePath);
  const importedRecords: ModuleRecords = {records: {[_modulePath]: glob}, importMetaFilename: import.meta.filename};

  const putted = await ext.putModules(importedRecords)
  expect(putted.isSuccess).toBe(true);
  const applied = await ext.beforeGet!('*', rest);
  expect(applied.isSuccess).toBe(true);
  return ext;
}

let categorizedModuleAmount = 0;
export const getCategorizedModuleAmount = (): number => {
  return categorizedModuleAmount;
}

/**
 * Imports
 * @returns 
 */
export const getImportRecords = (): ModuleRecords => {
  const imported = import.meta.glob("../node_modules/@ara-web/p-hintjens/**/*.js", {eager: true});
  
  categorizedModuleAmount = Object.keys(imported).length;
  return {
    records: imported,
    importMetaFilename: import.meta.filename,
  }
}

/**
 * Put the data into the module
 * @param reflect 
 * @returns 
 */
export const getSamplePackage = (): ModuleRecord => {
  const imported = import.meta.glob("packageurl-js", {eager: true});

  return {
    module: Object.values(imported)[0],
    importModuleClause: 'packageurl-js'
  }
}

export const getSamplePackageWithSubModules = (): ModuleRecord => {
  const imported = import.meta.glob("@ara-web/p-hintjens", {eager: true});

  return {
    module: Object.values(imported)[0],
    importModuleClause: `@ara-web/p-hintjens`
  }
}