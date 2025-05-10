import { expect, test } from "vitest";
import { Code } from "../src/code-level/code.js";
import { ValueTypeString } from "../src/code-level/code-piece-types.js";
import { ProjectMemory } from "../src/project-memory.js";

test('Identify literal value', async () => {
  const varValue = "/ara/act/ara-web/action/get";
  let exp = `"${varValue}"`;
  let projectMemory = new ProjectMemory();
  let calculationResult = await Code.identifyCodePiece(exp, projectMemory);
  expect(calculationResult.isSuccess).toBe(true);
  let calculated = calculationResult.getValue();
  expect(calculated.dataType).toEqual(ValueTypeString.string);
  expect(calculated.data).toEqual(varValue);
});

test('Linking to another variable value', async () => {
  const varValue = "Astro.params";
  let exp = `${varValue}`;

  let projectMemory = new ProjectMemory();
  let calculationResult = await Code.identifyCodePiece(exp, projectMemory);
  expect(calculationResult.isSuccess).toBe(false);  // Astro.params not supported yet.
});

// Decoupling with a new name.
// const { slug: slugName } = Astro.params;
test('Supports the object literal', async () => {
  const varValue = '1 + 3'
  const propertyName = 'slug'
  const exp = `{ ${propertyName}: ${varValue} }`;
  let projectMemory = new ProjectMemory();
  let calculationResult = await Code.identifyCodePiece(exp, projectMemory);
  expect(calculationResult.isSuccess).toBe(true);
  let calculated = calculationResult.getValue();
  expect(calculated.dataType).toEqual(ValueTypeString.object);
  expect(calculated.data).toEqual({ slug: 4 });

});

