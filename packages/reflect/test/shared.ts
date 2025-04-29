import  { type Result, AraLink, ModuleLink } from "@ara-web/ts-enhancement";
import { AstNode, AstNodeType, type AstIdentifiers } from "../src/code-level/ast-node.js";
import { expect } from "vitest";
import { ValueTypeString, type IdentifiedNodeDataType } from "../src/code-level/ast-node-data.js";
import { AstNodeContext } from "../src/code-level/AstNodeContext.js";
import { ProjectMemory } from "../src/ProjectMemory.js";
import { ModuleMemory } from "../src/ModuleMemory.js";
import { ExtensionInterface, ImportedRecords, MemoryOperations } from "../src/extension-interface.js";
import { ModuleCategory } from "../src/reflect-nodejs-ext/module.js";
import { FilePath } from "../src/module.js";

export type AstNodeProperties = Pick<AstNode, "constant" | "public">

export const expectAstNodeResult = (result: Result<AstIdentifiers>, identifier: string|string[]): void => {
    expect(result.isSuccess).toBe(true);
    if (Array.isArray(identifier)) {
      for (let i of identifier) {
        expect(result.getValue()[i]).toBeInstanceOf(AstNode);
      }
    } else {
      expect(result.getValue()[identifier]).toBeInstanceOf(AstNode);
    }
}
  
export const expectValidTypeNode = <DATA_TYPE>(astNode: AstNode, identfier: string, data: DATA_TYPE | string, dataType?: IdentifiedNodeDataType): void => {
    expect(astNode.identifier).toEqual(identfier)
    expect(astNode.nodeType).toEqual(AstNodeType.Type)
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

export const expectValidVariableNode = (astNode: AstNode, identfier: string, properties: AstNodeProperties, dataType?: IdentifiedNodeDataType): void => {
    expect(astNode.identifier).toEqual(identfier)
    expect(astNode.nodeType).toEqual(AstNodeType.Variable)
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

export const getEmptyContext = (identifers?: AstIdentifiers): AstNodeContext => {
  const projectMemory = new ProjectMemory()
  if (identifers === undefined) {
    identifers = {};
  }

  const context = new AstNodeContext([], identifers, projectMemory);

  return context;
}

export const modulePath = `./funcs.ts`;

export const getProjectMemory = (modOps: MemoryOperations): ProjectMemory => {
  const projectMemory = new ProjectMemory();
  projectMemory.putMemoryOperations(modOps);
  return projectMemory;
}

export const getEmptyModule = (): ModuleMemory<unknown> => {
  const fileModuleLink = ModuleLink.newFileURL(import.meta.filename);
  const moduleLink = ModuleLink.newPackageURL("reflect", "test", fileModuleLink, modulePath);
  return new ModuleMemory<unknown>(ModuleCategory.NodeJsModule, moduleLink, undefined);
}

export const putFuncModule = async (ext: ExtensionInterface): Promise<ExtensionInterface> => {
  const glob = await import(modulePath);
  const importedRecords: ImportedRecords = {records: {[modulePath]: glob}, importingFilePath: import.meta.filename};

  const putted = await ext.putModules(importedRecords)
  expect(putted.isSuccess).toBe(true);
  return ext;
}

let categorizedModuleAmount = 0;
export const getCategorizedModuleAmount = (): number => {
  return categorizedModuleAmount;
}

/**
 * Imports the packageurl-js as a file
 * @returns 
 */
export const getImportRecords = (): ImportedRecords => {
  const imported = import.meta.glob("../node_modules/packageurl-js/**/*.js", {eager: true});
  
  categorizedModuleAmount = Object.keys(imported).length;
  return {
    records: imported,
    importingFilePath: import.meta.filename,
  }
}

/**
 * Put the data into the module
 * @param reflect 
 * @returns 
 */
export const getSamplePackage = (): ImportedRecords & {importClause: string} => {
  const imported = import.meta.glob("packageurl-js", {eager: true});

  return {
    records: imported,
    importingFilePath: FilePath.getCurrentWorkingDir(),
    importClause: 'packageurl-js'
  }
}
