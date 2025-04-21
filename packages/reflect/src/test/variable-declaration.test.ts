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
import { expectAstNodeResult, expectValidVariableNode, type AstNodeProperties } from "./shared.js";
import { Debug } from "@ara-web/ts-enhancement";
import type { TsNode } from "../code-level/ts-node.js";
import { TypeRef } from "../code-level/type-level/type-ref.js";

test('Supports the simple variable declaration as public, export keywords too', async () => {
  const varName = 'parentUrl'
  const varValue = "/ara/act/ara-web/action/get";
  let src = `const ${varName} = "${varValue}"`;
  let code = new Code(src);
  let vars = code.getVariableIdentifiers();

  // Result
  expectAstNodeResult(vars, varName)
  let astNode = vars.getValue()[varName] as AstNode;
  let expectedProps: AstNodeProperties = {
    constant: true,
    public: false
  }
  expectValidVariableNode(astNode, varName, expectedProps);

  // Not a constant format
  src = `let ${varName} = "${varValue}"`;
  code = new Code(src);
  vars = code.getVariableIdentifiers();
  expectAstNodeResult(vars, varName)
  astNode = vars.getValue()[varName] as AstNode;
  expectedProps.constant = false;
  expectValidVariableNode(astNode, varName, expectedProps);

  // Export and constant
  src = `export const ${varName} = "${varValue}"`;
  code = new Code(src);
  vars = code.getVariableIdentifiers();
  expectAstNodeResult(vars, varName)
  astNode = vars.getValue()[varName] as AstNode;
  expectedProps.constant = true;
  expectedProps.public = true;
  expectValidVariableNode(astNode, varName, expectedProps);

  // Data undefined
  src = `export let ${varName};`;
  code = new Code(src);
  vars = code.getVariableIdentifiers();
  expectAstNodeResult(vars, varName)
  astNode = vars.getValue()[varName] as AstNode;
  expectedProps.constant = false;
  expectedProps.public = true;
  expectValidVariableNode(astNode, varName, expectedProps);
  expect(astNode.data).toBeUndefined();
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
  let expectedProps: AstNodeProperties = {
    constant: true,
    public: false
  }
  expectValidVariableNode(astNode, varName, expectedProps);

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
  let expectedProps: AstNodeProperties = {
    constant: true,
    public: false
  }
  expectValidVariableNode(astNode, varName, expectedProps);

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

// Support the variable with the type declaration
test('Supports the simple variable declaration as public, export keywords too', async () => {
  const varName = 'action'
  const varValue = "getActionBySlug(slug)";
  let src = `const ${varName}: Action | undefined = ${varValue}`;
  let code = new Code(src);
  let vars = code.getVariableIdentifiers();

  // Result
  expectAstNodeResult(vars, varName)
  let astNode = vars.getValue()[varName] as AstNode;
  let expectedProps: AstNodeProperties = {
    constant: true,
    public: false
  }
  expectValidVariableNode(astNode, varName, expectedProps, UnionTypeDeclaration);
  
  // Node Data
  const data = astNode.dataType as UnionTypeDeclaration;
  expect(data.unionLength).toEqual(2)
  expect(ReflectAraLink.isIdentifierLink(data.getUnion(0) as AraLink<string>)).toBe(true)
  expect((data.getUnion(0) as AraLink<string>).resource).toEqual('Action')
  expect(data.getUnion(1)).toEqual(ValueTypeString.undefined)
});

// Support the variable declaration with the generic value
// const data: Array<string> = func<string>();
test('Supports the the variable declaration with the generic value', async () => {
  const varName = 'data'
  const varValue = "func<string>()";
  let src = `const ${varName}: Array<string> = ${varValue}`;
  let code = new Code(src);
  let vars = code.getVariableIdentifiers();

  // Result
  expectAstNodeResult(vars, varName)
  let astNode = vars.getValue()[varName] as AstNode;
  let expectedProps: AstNodeProperties = {
    constant: true,
    public: false
  }
  expectValidVariableNode(astNode, varName, expectedProps, AraLink);
  
  // Node Data
  const data = astNode.dataType as AraLink<string>;
  expect(ReflectAraLink.isIdentifierLink(data)).toBe(true)
  expect(data.isPropertyExist(TypeRef.GENERIC_VALUES_LINK_PROPERTY)).toBe(true);
  const genericProps = TypeRef.linkPropertyToGenericValues(data);
  expect(genericProps).toHaveLength(1);
  expect(genericProps[0]).toEqual(ValueTypeString.string)
});
