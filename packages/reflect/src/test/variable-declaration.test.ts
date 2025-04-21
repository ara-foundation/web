import { expect, test } from "vitest";
import { Code } from "../code-level/Code.js";
import { Result, type Page } from "@ara-web/ts-enhancement";
import { AstNode, AstNodeType, type AstIdentifiers } from "../code-level/ast-node.js";
import { IntersectedUnionType, TypeDeclaration, UnionTypeDeclaration, ValueTypeString, type IdentifiedNodeDataType } from "../code-level/ast-node-data.js";
import { ModuleMemory } from "../memory/ModuleMemory.js";
import { ModuleType } from "../module.js";
import { ProjectMemory } from "../memory/ProjectMemory.js";
import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import { ReflectAraLink } from "../ara-link/ReflectAraLink.js";
import { EnabledNodejsModules } from "../enabled-nodejs-module.js";
import { TypeValueTraits } from "../code-level/type-level/type-value-traits.js";
import { expectAstNodeResult, expectValidVariableNode } from "./shared.js";
import { Debug } from "@ara-web/ts-enhancement";
import type { TsNode } from "../code-level/ts-node.js";

test('Supports the simple variable declaration as public, export keywords too', async () => {
  const varName = 'parentUrl'
  const varValue = "/ara/act/ara-web/action/get";
  let src = `const ${varName} = "${varValue}"`;
  let code = new Code(src);
  let vars = code.getVariableIdentifiers();

  // Result
  expectAstNodeResult(vars, varName)
  let astNode = vars.getValue()[varName] as AstNode;
  expectValidVariableNode(astNode, varName, true, false);

  // Not a constant format
  src = `let ${varName} = "${varValue}"`;
  code = new Code(src);
  vars = code.getVariableIdentifiers();
  expectAstNodeResult(vars, varName)
  astNode = vars.getValue()[varName] as AstNode;
  expectValidVariableNode(astNode, varName, false, false);

  // Export and constant
  src = `export const ${varName} = "${varValue}"`;
  code = new Code(src);
  vars = code.getVariableIdentifiers();
  expectAstNodeResult(vars, varName)
  astNode = vars.getValue()[varName] as AstNode;
  expectValidVariableNode(astNode, varName, true, true);
});

test('Supports the variable declaration derived from the object decoupling', async () => {
  const varName = 'slug'
  const varValue = "Astro.params";
  const src = `const { ${varName} } = "${varValue}"`;
  const code = new Code(src);
  const vars = code.getVariableIdentifiers();
  // Result
  expectAstNodeResult(vars, varName)
  const astNode = vars.getValue()[varName] as AstNode;
  expectValidVariableNode(astNode, varName, true, false);

  // The Ast node's data must be a link to the identifier
  expect(ReflectAraLink.isIdentifierLink(astNode.data as AraLink<string>)).toBe(true)
  expect((astNode.data as AraLink<string>).resource).toBe(varName)

  // The Ast node's binding should a property of the expression
  expect(astNode.memoryDataLength()).toEqual(1)
  expect(astNode.getMemoryData(0)?.identifier).toBe(varName)
  expect(ReflectAraLink.isExpressionLink(astNode.getMemoryData(0)?.data as AraLink<TsNode>)).toBe(true)
  expect(astNode.getMemoryData(0)?.nodeType).toBe(AstNodeType.Property)
  expect(astNode.getMemoryData(0)?.dataType).toBeUndefined();
});

// Decoupling with a new name.
// const { slug: slugName } = Astro.params;
test('Supports the variable declaration by alias derived from the object decoupling', async () => {
  const varName = 'derivedSlug'
  const propertyName = 'slug'
  const varValue = "Astro.params";
  const src = `const { ${propertyName}: ${varName} } = "${varValue}"`;
  const code = new Code(src);
  const vars = code.getVariableIdentifiers();
  // Result
  expectAstNodeResult(vars, varName)
  const astNode = vars.getValue()[varName] as AstNode;
  expectValidVariableNode(astNode, varName, true, false);

  // The Ast node's data must be a link to the identifier
  expect(ReflectAraLink.isIdentifierLink(astNode.data as AraLink<string>)).toBe(true)
  expect((astNode.data as AraLink<string>).resource).toBe(propertyName)

  // The Ast node's binding should a property of the expression
  expect(astNode.memoryDataLength()).toEqual(1)
  expect(astNode.getMemoryData(0)?.identifier).toBe(propertyName)
  expect(ReflectAraLink.isExpressionLink(astNode.getMemoryData(0)?.data as AraLink<TsNode>)).toBe(true)
  expect(astNode.getMemoryData(0)?.nodeType).toBe(AstNodeType.Property)
  expect(astNode.getMemoryData(0)?.dataType).toBeUndefined();
});

