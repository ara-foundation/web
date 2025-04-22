import { expect, test } from "vitest";
import { Code } from "../code-level/Code.js";
import { AstNode, AstNodeType } from "../code-level/ast-node.js";
import { UnionTypeDeclaration, ValueTypeString } from "../code-level/ast-node-data.js";
import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import { ReflectAraLink } from "../ara-link/ReflectAraLink.js";
import { expectAstNodeResult, expectValidVariableNode, getEmptyContext, getEmptyModule, getProjectMemory, modulePath, type AstNodeProperties } from "./shared.js";
import type { TsNode } from "../code-level/ts-node.js";
import { TypeRef } from "../code-level/type-level/type-ref.js";
import { AstNodeContext } from "../memory/AstNodeContext.js";
import { ValueLevel } from "../code-level/value-level.js";

test('Supports the simple variable declaration as public, export keywords too', async () => {
  const varName = 'parentUrl'
  const varValue = "/ara/act/ara-web/action/get";
  let src = `const ${varName} = "${varValue}"`;
  let code = new Code(src);
  let vars = await code.getVariableIdentifiers();

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
  vars = await code.getVariableIdentifiers();
  expectAstNodeResult(vars, varName)
  astNode = vars.getValue()[varName] as AstNode;
  expectedProps.constant = false;
  expectValidVariableNode(astNode, varName, expectedProps);

  // Export and constant
  src = `export const ${varName} = "${varValue}"`;
  code = new Code(src);
  vars = await code.getVariableIdentifiers();
  expectAstNodeResult(vars, varName)
  astNode = vars.getValue()[varName] as AstNode;
  expectedProps.constant = true;
  expectedProps.public = true;
  expectValidVariableNode(astNode, varName, expectedProps);

  // Data undefined
  src = `export let ${varName};`;
  code = new Code(src);
  vars = await code.getVariableIdentifiers();
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
  const vars = await code.getVariableIdentifiers();
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
  const vars = await code.getVariableIdentifiers();
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
  let vars = await code.getVariableIdentifiers();

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
  let vars = await code.getVariableIdentifiers();

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

///////////////////////////////////////////////////////////////////////////////////////////////////
//
// Variable Linting
//
///////////////////////////////////////////////////////////////////////////////////////////////////

test('Supports the literal value assignment', async () => {
  const varName = 'parentUrl'
  const varValue = "/ara/act/ara-web/action/get";
  let src = `const ${varName} = "${varValue}"`;
  let code = new Code(src);
  let vars = await code.getVariableIdentifiers();

  // We don't check the result, as previous tests must ensure its passing
  let astNode = vars.getValue()[varName] as AstNode;
  expect(astNode.data).toBeInstanceOf(AraLink)
  expect(ReflectAraLink.isExpressionLink(astNode.data)).toBe(true)

  const context = getEmptyContext();
  const identifiedData = await ValueLevel.identifyAstNodeData(astNode, context);
  expect(identifiedData.isSuccess).toBe(true);
  astNode.typedData = identifiedData.getValue();
  expect(astNode.dataType).toEqual(ValueTypeString.string);
  expect(astNode.data).toEqual(varValue)
});


// To work with function result, we need to create a function declaration.
// function call as a result.
test('Supports the function call as variable value', async () => {
  const projectMemory = await getProjectMemory();
  const moduleMemory = getEmptyModule();

  const funcName = 'fooBar'
  const varName = 'nameLength'

  const varValue = `${funcName}('medet', 'ahmetson')`;
  let src = `import { ${funcName} } from "${modulePath}";` +
  ` const ${varName} = ${varValue}`;

  let code = new Code(src);
  let vars = await code.getVariableIdentifiers();

  let imports = code.getImportedIdentifiers();
  expect(imports.isSuccess).toBe(true);
  moduleMemory.addIdentifiers(imports.getValue())
  let identified = await code.getLintedImportIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // We don't check the result, as previous tests must ensure its passing
  let astNode = vars.getValue()[varName] as AstNode;
  expect(astNode.data).toBeInstanceOf(AraLink)
  expect(astNode.dataType).toBeUndefined();
  expect(ReflectAraLink.isExpressionLink(astNode.data)).toBe(true)

  const context = new AstNodeContext([], moduleMemory.getIdentifiers(), projectMemory);
  const identifiedData = await ValueLevel.identifyAstNodeData(astNode, context);
  expect(identifiedData.isSuccess).toBe(true);
  astNode.typedData = identifiedData.getValue();
  expect(astNode.dataType).toEqual(ValueTypeString.number);
  expect(('medet' + 'ahmetson')).toHaveLength(astNode.data as number)
});

// function call, but variable has defined type such as string
// but function returns another type.
test('Supports the function call as variable value but mismatch the types', async () => {
  const projectMemory = await getProjectMemory();
  const moduleMemory = getEmptyModule();

  const funcName = 'fooBar'
  const varName = 'nameLength'

  const varValue = `${funcName}('medet', 'ahmetson')`;
  let src = `import { ${funcName} } from "${modulePath}";` +
  ` const ${varName}: string = ${varValue}`;

  let code = new Code(src);
  let vars = await code.getVariableIdentifiers();

  let imports = code.getImportedIdentifiers();
  expect(imports.isSuccess).toBe(true);
  moduleMemory.addIdentifiers(imports.getValue())
  let identified = await code.getLintedImportIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // We don't check the result, as previous tests must ensure its passing
  let astNode = vars.getValue()[varName] as AstNode;
  expect(astNode.data).toBeInstanceOf(AraLink)
  expect(astNode.dataType).toEqual(ValueTypeString.string)
  expect(ReflectAraLink.isExpressionLink(astNode.data)).toBe(true)

  const context = new AstNodeContext([], moduleMemory.getIdentifiers(), projectMemory);
  const identifiedData = await ValueLevel.identifyAstNodeData(astNode, context);
  expect(identifiedData.isSuccess).toBe(false);
});

// function call without any argument
test('Supports the function call without any argument', async () => {
  const projectMemory = await getProjectMemory();
  const moduleMemory = getEmptyModule();

  const funcName = 'helloAndWelcome'
  const varName = 'greeting'
  const varValue = `Hello and Welcome`;

  let src = `import { ${funcName} } from "${modulePath}";` +
  ` const ${varName}: string = ${funcName}( );`;

  let code = new Code(src);
  let vars = await code.getVariableIdentifiers();

  let imports = code.getImportedIdentifiers();
  expect(imports.isSuccess).toBe(true);
  moduleMemory.addIdentifiers(imports.getValue())
  let identified = await code.getLintedImportIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // We don't check the result, as previous tests must ensure its passing
  let astNode = vars.getValue()[varName] as AstNode;
  expect(astNode.data).toBeInstanceOf(AraLink)
  expect(astNode.dataType).toEqual(ValueTypeString.string)
  expect(ReflectAraLink.isExpressionLink(astNode.data)).toBe(true)

  const context = new AstNodeContext([], moduleMemory.getIdentifiers(), projectMemory);
  const identifiedData = await ValueLevel.identifyAstNodeData(astNode, context);
  expect(identifiedData.isSuccess).toBe(true);
  astNode.typedData = identifiedData.getValue();
  expect(astNode.dataType).toEqual(ValueTypeString.string);
  expect(astNode.data).toEqual(varValue)
});

// method call as a result
test('Supports the method call', async () => {
  const projectMemory = await getProjectMemory();
  const moduleMemory = getEmptyModule();

  const funcName = 'fooBar'
  const objName = 'CustomObj'
  const varName = 'greeting'
  const varValue = 10;

  let src = 
  `import { ${funcName} } from "${modulePath}";` +
  ` const ${objName} = {customMethod: ${funcName} }` +
  ` const ${varName}: number = CustomObj.customMethod('12345', '67890');`;

  let code = new Code(src);
  let vars = await code.getVariableIdentifiers();

  let imports = code.getImportedIdentifiers();
  expect(imports.isSuccess).toBe(true);
  moduleMemory.addIdentifiers(imports.getValue())
  let identified = await code.getLintedImportIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  let objAstNode = vars.getValue()[objName] as AstNode;
  expect(objAstNode.data).toBeInstanceOf(AraLink)
  expect(objAstNode.dataType).toBeUndefined()
  expect(ReflectAraLink.isExpressionLink(objAstNode.data)).toBe(true)
  moduleMemory.addIdentifiers({[objAstNode.identifier!]: objAstNode})

  // We don't check the result, as previous tests must ensure its passing
  let astNode = vars.getValue()[varName] as AstNode;
  expect(astNode.data).toBeInstanceOf(AraLink)
  expect(astNode.dataType).toEqual(ValueTypeString.number)
  expect(ReflectAraLink.isExpressionLink(astNode.data)).toBe(true)

  const context = new AstNodeContext([], moduleMemory.getIdentifiers(), projectMemory);
  const identifiedData = await ValueLevel.identifyAstNodeData(astNode, context);
  expect(identifiedData.isSuccess).toBe(true);
  astNode.typedData = identifiedData.getValue();
  expect(astNode.dataType).toEqual(ValueTypeString.number);
  expect(astNode.data).toEqual(varValue)
});

// if data type is linked, then define the data type.
// define the result from another variable that is already linted.
// assert that data assignment data type matches astNode.dataType.
//  assert the generic data type that returned data matches the generic data type.
//  assert the assigned data type matches the union type.
// Make sure the all in ValueLevel.identifyValue() matches
// Support Enum assignments and enum value access

//
// Check the variable updates
//

// Check the functions that update the variable?