import  { type Result } from "@ara-web/ts-enhancement";
import { AstNode, AstNodeType, type AstIdentifiers } from "../src/code-level/ast-node.js";
import { expect } from "vitest";
import { ValueTypeString, type IdentifiedNodeDataType } from "../src/code-level/ast-node-data.js";
import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import { AstNodeContext } from "../src/memory/AstNodeContext.js";
import { ProjectMemory } from "../src/memory/ProjectMemory.js";
import { ModuleCategory, trimPath } from "../src/module.js";
import { ModuleMemory } from "../src/memory/ModuleMemory.js";
import { ModuleLink } from "../src/ara-link/ReflectAraLink.js";
import { type PossibleModuleLinksBuilder } from "../src/extension-interface.js";
import { CategorizedModules } from "../src/setup.js";
import { ModuleCategory as BuiltinModuleCategory } from "../src/reflect-nodejs-ext/module.js";

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

export const modulePath = `./funcs.js`;
export const moduleLinkBuilder: PossibleModuleLinksBuilder = (modulePath: string): ModuleLink[] => {
  const moduleCategory = "script";
  const moduleLink = new ModuleLink("namespace", "name", moduleCategory, modulePath);
  return [moduleLink];
}

export const getProjectMemory = async (): Promise<ProjectMemory> => {
  let glob = await import(modulePath)
  const moduleMemory = new ModuleMemory<unknown>(moduleLinkBuilder(modulePath)[0], glob);
  const projectMemory = new ProjectMemory();
  projectMemory.putModuleMemory(moduleMemory);
  projectMemory.putModuleLinksBuilder(moduleLinkBuilder);
  return projectMemory;
}

export const getEmptyModule = (): ModuleMemory<unknown> => {
  const moduleLink = new ModuleLink("namespace", "name", ModuleCategory.Untracked, "");
  return new ModuleMemory<unknown>(moduleLink, undefined);
}

let categorizedModuleAmount = 0;
export const getCategorizedModuleAmount = (): number => {
  return categorizedModuleAmount;
}

export const getImportRecords = (): Record<string, unknown> => {
  const imported = import.meta.glob("../node_modules/packageurl-js/**/*.js", {eager: true});
  
  const records: Record<string, unknown> = {};

  categorizedModuleAmount = 0;
  for (let rawModulePath in imported) {
    const modulePath = trimPath(rawModulePath).replace("node_modules", "");
    records[modulePath] = imported[rawModulePath];
    categorizedModuleAmount++;
  }

  return records;
}

export const getCategorizedModuleData = (): CategorizedModules => {
  const imported = getImportRecords();
  
  const categorizedModules: CategorizedModules = {
    [BuiltinModuleCategory.NodeJsModule]: {}
  };
  
  categorizedModuleAmount = 0;
  for (let modulePath in imported) {
    categorizedModules[BuiltinModuleCategory.NodeJsModule][modulePath] = {
      glob: imported[modulePath]
    };

    categorizedModuleAmount++;
  }
  return categorizedModules;
}