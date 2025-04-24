import { AstNode, AstNodeType } from "../code-level/ast-node.js";
import { expect } from "vitest";
import { ValueTypeString } from "../code-level/ast-node-data.js";
import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import { AstNodeContext } from "../memory/AstNodeContext.js";
import { ProjectMemory } from "../memory/ProjectMemory.js";
import { ModuleType } from "../module.js";
import { ModuleMemory } from "../memory/ModuleMemory.js";
export const expectAstNodeResult = (result, identifier) => {
    expect(result.isSuccess).toBe(true);
    if (Array.isArray(identifier)) {
        for (let i of identifier) {
            expect(result.getValue()[i]).toBeInstanceOf(AstNode);
        }
    }
    else {
        expect(result.getValue()[identifier]).toBeInstanceOf(AstNode);
    }
};
export const expectValidTypeNode = (astNode, identfier, data, dataType) => {
    expect(astNode.identifier).toEqual(identfier);
    expect(astNode.nodeType).toEqual(AstNodeType.Type);
    if (typeof data === "string") {
        expect(astNode.data).toBe(data);
    }
    else if (data === undefined) {
        expect(astNode.data).toStrictEqual({});
    }
    else {
        expect(astNode.data).toBeInstanceOf(data);
    }
    if (dataType === undefined) {
        expect(astNode.dataType).toBeUndefined();
    }
    else {
        expect(astNode.dataType).toEqual(dataType);
    }
};
export const expectValidVariableNode = (astNode, identfier, properties, dataType) => {
    expect(astNode.identifier).toEqual(identfier);
    expect(astNode.nodeType).toEqual(AstNodeType.Variable);
    if (astNode.data !== undefined) {
        expect(astNode.data).toBeInstanceOf(AraLink);
    }
    // Property check
    expect(astNode.constant).toBe(properties.constant);
    expect(astNode.public).toBe(properties.public);
    // Data Type check
    if (dataType === undefined || dataType === ValueTypeString.undefined) {
        expect(astNode.dataType).toBeUndefined();
    }
    else if (dataType === ValueTypeString.object) {
        expect(astNode.dataType).toStrictEqual({});
    }
    else if (typeof dataType === "string") {
        expect(astNode.dataType).toBe(dataType);
    }
    else {
        expect(astNode.dataType).toBeInstanceOf(dataType);
    }
};
export const getEmptyContext = (identifers) => {
    const projectMemory = new ProjectMemory();
    if (identifers === undefined) {
        identifers = {};
    }
    const context = new AstNodeContext([], identifers, projectMemory);
    return context;
};
export const modulePath = `./funcs.js`;
export const getProjectMemory = async () => {
    const moduleType = ModuleType.Script;
    let glob = await import(modulePath);
    const moduleMemory = new ModuleMemory(moduleType, modulePath, glob);
    const projectMemory = new ProjectMemory();
    projectMemory.putModuleMemory(moduleType, modulePath, moduleMemory);
    return projectMemory;
};
export const getEmptyModule = () => {
    return new ModuleMemory(ModuleType.Untracked, '', undefined);
};
