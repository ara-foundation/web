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
  Debug.log(vars);
  // Result
  expectAstNodeResult(vars, varName)
  const astNode = vars.getValue()[varName] as AstNode;
  expectValidVariableNode(astNode, varName, true, false);
});

