import type { Result } from "@ara-web/ts-enhancement";
import { AstNode, AstNodeType, type AstIdentifiers } from "../code-level/ast-node.js";
import { expect } from "vitest";
import { ValueTypeString, type IdentifiedNodeDataType } from "../code-level/ast-node-data.js";
import { AraLink } from "@ara-web/ts-enhancement/ara-link";

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