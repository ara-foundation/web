import  { type Result } from "@ara-web/p-hintjens";
import { AraLink, ModuleLink, Restful, ExtensionOperator, RestfulExtensionOperator, Extendable } from "@ara-web/sds";
import { CodePiece, CodePieceType } from "../src/code-level/code-piece.js";
import { expect } from "vitest";
import { ValueTypeString, type IdentifiedNodeDataType } from "../src/code-level/code-piece-types.js";
import { CodePieceContext } from "../src/code-level/code-piece-context.js";
import { ModuleMemoryOperator } from "../src/module-manager-operator.js";
import { ModuleMemory } from "../src/module-memory.js";
import { ModuleRecords, ModuleManager, ModuleRecord } from "../src/module-manager.js";
import { ModuleCategory } from "../src/builtin-module-manager.js";
import { MEMOP_TAG, ReflectDataType } from "../src/reflect-object-tree.js";

export type AstNodeProperties = Pick<CodePiece, "constant" | "public">

export const expectAstNodeResult = (result: Result<CodePiece[]>, identifier: string|string[]): void => {
    expect(result.isSuccess).toBe(true);
}
  
export const expectValidTypeNode = <DATA_TYPE>(astNode: CodePiece, identfier: string, data: DATA_TYPE | string, dataType?: IdentifiedNodeDataType): void => {
  expect(astNode !== undefined).toBe(true);  
  expect(astNode.identifier).toEqual(identfier)
    expect(astNode.nodeType).toEqual(CodePieceType.Type)
    if (typeof data === "string") {
      expect(astNode.data).toBe(data)
    } else if (data === undefined) {
      expect(astNode.data).toStrictEqual({})
    } else {
      expect(astNode.data).toBeInstanceOf(data)
    }
  
    if (dataType === undefined) {
      expect(astNode.dataType).toBeUndefined();
    } else {
      expect(astNode.dataType).toEqual(dataType)
    }
}

export const expectValidVariableNode = (astNode: CodePiece, identfier: string, properties: AstNodeProperties, dataType?: IdentifiedNodeDataType): void => {
    expect(astNode.identifier).toEqual(identfier)
    expect(astNode.nodeType).toEqual(CodePieceType.Variable)
    if (astNode.data !== undefined) {
      expect(astNode.data).toBeInstanceOf(AraLink);
    }

    // Property check
    expect(astNode.constant).toBe(properties.constant)
    expect(astNode.public).toBe(properties.public)

    // Data Type check
    if (dataType === undefined || dataType === ValueTypeString.undefined) {
      expect(astNode.dataType).toBeUndefined();
    } else if (dataType === ValueTypeString.object) {
      expect(astNode.dataType).toStrictEqual({})
    } else if (typeof dataType === "string") {
      expect(astNode.dataType).toBe(dataType)
    } else {
      expect(astNode.dataType).toBeInstanceOf(dataType)
    }
}

export const getEmptyContext = (identifers?: CodePiece[]): CodePieceContext => {
  if (identifers === undefined) {
    identifers = [];
  }

  const context = new CodePieceContext([], identifers);

  return context;
}

export const modulePath = `./funcs.ts`;

export const getProjectMemory = (modOps: ModuleManager[]): ModuleMemoryOperator => {
  const extOp = new ExtensionOperator(modOps);
  const projectMemory = new ModuleMemoryOperator(extOp)
  return projectMemory;
}

export const getEmptyModule = (filePath: string = import.meta.filename): ModuleMemory<unknown> => {
  const fileModuleLink = ModuleLink.newFileLink(filePath);
  const moduleLink = ModuleLink.newPackageLink("reflect", "test", modulePath, {absolutePath: fileModuleLink.url});
  return new ModuleMemory(ModuleCategory.NodeJsModule, moduleLink, undefined);
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