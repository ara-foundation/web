import type { Result } from "@ara-web/ts-enhancement";
import { AstNode, AstNodeType, type AstIdentifiers } from "../code-level/ast-node.js";
import { expect } from "vitest";
import type { IdentifiedNodeDataType } from "../code-level/ast-node-data.js";
import { AraLink } from "@ara-web/ts-enhancement/ara-link";

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

export const expectValidVariableNode = (astNode: AstNode, identfier: string, constantFlag: boolean, publicFlag: boolean): void => {
    expect(astNode.identifier).toEqual(identfier)
    expect(astNode.nodeType).toEqual(AstNodeType.Variable)
    expect(astNode.data).toBeInstanceOf(AraLink);
    expect(astNode.dataType).toBeUndefined();
    expect(astNode.constant).toBe(constantFlag)
    expect(astNode.public).toBe(publicFlag)
}