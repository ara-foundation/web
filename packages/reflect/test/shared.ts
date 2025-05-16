import  { type Result } from "@ara-web/p-hintjens";
import { AraLink, ModuleLink } from "@ara-web/sds";
import { CodePiece, CodePieceType, type CodePieceRecord } from "../src/code-level/code-piece.js";
import { expect } from "vitest";
import { ValueTypeString, type IdentifiedNodeDataType } from "../src/code-level/code-piece-types.js";
import { CodePieceContext } from "../src/code-level/code-piece-context.js";
import { ProjectMemory } from "../src/project-memory.js";
import { ModuleMemory } from "../src/module-memory.js";
import { ExtensionInterface, ImportedRecords, MemoryOperations, SingleRecord } from "../src/extension-interface.js";
import { ModuleCategory } from "../src/reflect-nodejs-ext/index.js";
import { FilePath } from "../src/module.js";

export type AstNodeProperties = Pick<CodePiece, "constant" | "public">

export const expectAstNodeResult = (result: Result<CodePieceRecord>, identifier: string|string[]): void => {
    expect(result.isSuccess).toBe(true);
    if (Array.isArray(identifier)) {
      for (let i of identifier) {
        expect(result.getValue()[i]).toBeInstanceOf(CodePiece);
      }
    } else {
      expect(result.getValue()[identifier]).toBeInstanceOf(CodePiece);
    }
}
  
export const expectValidTypeNode = <DATA_TYPE>(astNode: CodePiece, identfier: string, data: DATA_TYPE | string, dataType?: IdentifiedNodeDataType): void => {
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

export const getEmptyContext = (identifers?: CodePieceRecord): CodePieceContext => {
  const projectMemory = new ProjectMemory()
  if (identifers === undefined) {
    identifers = {};
  }

  const context = new CodePieceContext([], identifers, projectMemory);

  return context;
}

export const modulePath = `./funcs.ts`;

export const getProjectMemory = (modOps: MemoryOperations): ProjectMemory => {
  const projectMemory = new ProjectMemory();
  projectMemory.putMemoryOperations(modOps);
  return projectMemory;
}

export const getEmptyModule = (filePath: string = import.meta.filename): ModuleMemory<unknown> => {
  const fileModuleLink = ModuleLink.newFileURL(filePath);
  const moduleLink = ModuleLink.newPackageURL("reflect", "test", fileModuleLink, modulePath);
  return new ModuleMemory(ModuleCategory.NodeJsModule, moduleLink, undefined);
}

export const putFuncModule = async (ext: ExtensionInterface, _modulePath: string = modulePath): Promise<ExtensionInterface> => {
  const glob = await import(_modulePath);
  const importedRecords: ImportedRecords = {records: {[_modulePath]: glob}, importMetaFilename: import.meta.filename};

  const putted = await ext.putModules(importedRecords)
  expect(putted.isSuccess).toBe(true);
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
export const getImportRecords = (): ImportedRecords => {
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
export const getSamplePackage = (): SingleRecord => {
  const imported = import.meta.glob("packageurl-js", {eager: true});

  return {
    module: Object.values(imported)[0],
    importModuleClause: 'packageurl-js'
  }
}

export const getSamplePackageWithSubModules = (): SingleRecord => {
  const imported = import.meta.glob("@ara-web/p-hintjens", {eager: true});

  return {
    module: Object.values(imported)[0],
    importModuleClause: `@ara-web/p-hintjens`
  }
}