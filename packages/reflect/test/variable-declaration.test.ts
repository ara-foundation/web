import { expect, test } from "vitest";
import { Code } from "../src/code-level/Code.js";
import { AstNode, AstNodeType } from "../src/code-level/ast-node.js";
import { IntersectedUnionType, TypeDeclaration, UnionTypeDeclaration, ValueTypeString } from "../src/code-level/ast-node-data.js";
import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import { CodeLink } from "../src/code-level/CodeLink.js";
import { Reflect } from "../src/Reflect.js"
import { expectAstNodeResult, expectValidVariableNode, getEmptyContext, getEmptyModule, getProjectMemory, modulePath, putFuncModule, type AstNodeProperties } from "./shared.js";
import type { TsNode } from "../src/code-level/ts-node.js";
import { TypeRef } from "../src/code-level/type-level/type-ref.js";
import { AstNodeContext } from "../src/memory/AstNodeContext.js";
import { ValueLevel } from "../src/code-level/value-level.js";
import { BuiltInIdentifiers } from "../src/reflect-nodejs-ext/BuiltInIdentifiers.js";
import { ModuleLink } from "@ara-web/ts-enhancement/module-link";

test('Supports the simple variable declaration as public, export keywords too', async () => {
  const varName = 'parentUrl'
  const varValue = "/ara/act/ara-web/action/get";
  let src = `const ${varName} = "${varValue}"`;
  let code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
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
  code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  vars = await code.getVariableIdentifiers();
  expectAstNodeResult(vars, varName)
  astNode = vars.getValue()[varName] as AstNode;
  expectedProps.constant = false;
  expectValidVariableNode(astNode, varName, expectedProps);

  // Export and constant
  src = `export const ${varName} = "${varValue}"`;
  code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  vars = await code.getVariableIdentifiers();
  expectAstNodeResult(vars, varName)
  astNode = vars.getValue()[varName] as AstNode;
  expectedProps.constant = true;
  expectedProps.public = true;
  expectValidVariableNode(astNode, varName, expectedProps);

  // Data undefined
  src = `export let ${varName};`;
  code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
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
  const code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
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
  expect(CodeLink.isIdentifierLink(astNode.data as AraLink<string>)).toBe(true)
  expect((astNode.data as AraLink<string>).resource).toBe(varName)

  // The Ast node's binding should a property of the expression
  expect(astNode.memoryDataLength()).toEqual(1)
  expect(astNode.getMemoryData(0)?.identifier).toBe(varName)
  expect(CodeLink.isExpressionLink(astNode.getMemoryData(0)?.data as AraLink<TsNode>)).toBe(true)
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
  const code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
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
  expect(CodeLink.isIdentifierLink(astNode.data as AraLink<string>)).toBe(true)
  expect((astNode.data as AraLink<string>).resource).toBe(propertyName)

  // The Ast node's binding should a property of the expression
  expect(astNode.memoryDataLength()).toEqual(1)
  expect(astNode.getMemoryData(0)?.identifier).toBe(propertyName)
  expect(CodeLink.isExpressionLink(astNode.getMemoryData(0)?.data as AraLink<TsNode>)).toBe(true)
  expect(astNode.getMemoryData(0)?.nodeType).toBe(AstNodeType.Property)
  expect(astNode.getMemoryData(0)?.dataType).toBeUndefined();
});

// Support the variable with the type declaration
test('Supports the simple variable declaration as public, export keywords too', async () => {
  const varName = 'action'
  const varValue = "getActionBySlug(slug)";
  let src = `const ${varName}: Action | undefined = ${varValue}`;
  let code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
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
  expect(CodeLink.isIdentifierLink(data.getUnion(0) as AraLink<string>)).toBe(true)
  expect((data.getUnion(0) as AraLink<string>).resource).toEqual('Action')
  expect(data.getUnion(1)).toEqual(ValueTypeString.undefined)
});

// Support the variable declaration with the generic value
// const data: Array<string> = func<string>();
test('Supports the the variable declaration with the generic value', async () => {
  const varName = 'data'
  const varValue = "func<string>()";
  let src = `const ${varName}: Array<string> = ${varValue}`;
  let code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
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
  expect(CodeLink.isIdentifierLink(data)).toBe(true)
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
  let code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  let vars = await code.getVariableIdentifiers();

  // We don't check the result, as previous tests must ensure its passing
  let astNode = vars.getValue()[varName] as AstNode;
  expect(astNode.data).toBeInstanceOf(AraLink)
  expect(CodeLink.isExpressionLink(astNode.data)).toBe(true)

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
  const reflect = new Reflect();
  const projectMemory = getProjectMemory(reflect.nodeJsExt);
  const moduleMemory = getEmptyModule();
  await putFuncModule(reflect.nodeJsExt);

  const funcName = 'fooBar'
  const varName = 'nameLength'

  const varValue = `${funcName}('medet', 'ahmetson')`;
  let src = `import { ${funcName} } from "${modulePath}";` +
  ` const ${varName} = ${varValue}`;

  let code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  let vars = await code.getVariableIdentifiers();

  let imports = await code.getImportedIdentifiers(projectMemory);
  expect(imports.isSuccess).toBe(true);
  moduleMemory.addIdentifiers(imports.getValue())
  let identified = await code.getLintedImportIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // We don't check the result, as previous tests must ensure its passing
  let astNode = vars.getValue()[varName] as AstNode;
  expect(astNode.data).toBeInstanceOf(AraLink)
  expect(astNode.dataType).toBeUndefined();
  expect(CodeLink.isExpressionLink(astNode.data)).toBe(true)

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
  const reflect = new Reflect();
  const projectMemory = getProjectMemory(reflect.nodeJsExt);
  const moduleMemory = getEmptyModule();
  await putFuncModule(reflect.nodeJsExt);

  const funcName = 'fooBar'
  const varName = 'nameLength'

  const varValue = `${funcName}('medet', 'ahmetson')`;
  let src = `import { ${funcName} } from "${modulePath}";` +
  ` const ${varName}: string = ${varValue}`;

  let code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  let vars = await code.getVariableIdentifiers();

  let imports = await code.getImportedIdentifiers(projectMemory);
  expect(imports.isSuccess).toBe(true);
  moduleMemory.addIdentifiers(imports.getValue())
  let identified = await code.getLintedImportIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // We don't check the result, as previous tests must ensure its passing
  let astNode = vars.getValue()[varName] as AstNode;
  expect(astNode.data).toBeInstanceOf(AraLink)
  expect(astNode.dataType).toEqual(ValueTypeString.string)
  expect(CodeLink.isExpressionLink(astNode.data)).toBe(true)

  const context = new AstNodeContext([], moduleMemory.getIdentifiers(), projectMemory);
  const identifiedData = await ValueLevel.identifyAstNodeData(astNode, context);
  expect(identifiedData.isSuccess).toBe(false);
});

// function call without any argument
test('Supports the function call without any argument', async () => {
  const reflect = new Reflect();
  const projectMemory = getProjectMemory(reflect.nodeJsExt);
  const moduleMemory = getEmptyModule();
  await putFuncModule(reflect.nodeJsExt);

  const funcName = 'helloAndWelcome'
  const varName = 'greeting'
  const varValue = `Hello and Welcome`;

  let src = `import { ${funcName} } from "${modulePath}";` +
  ` const ${varName}: string = ${funcName}( );`;

  let code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  let vars = await code.getVariableIdentifiers();

  let imports = await code.getImportedIdentifiers(projectMemory);
  expect(imports.isSuccess).toBe(true);
  moduleMemory.addIdentifiers(imports.getValue())
  let identified = await code.getLintedImportIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // We don't check the result, as previous tests must ensure its passing
  let astNode = vars.getValue()[varName] as AstNode;
  expect(astNode.data).toBeInstanceOf(AraLink)
  expect(astNode.dataType).toEqual(ValueTypeString.string)
  expect(CodeLink.isExpressionLink(astNode.data)).toBe(true)

  const context = new AstNodeContext([], moduleMemory.getIdentifiers(), projectMemory);
  const identifiedData = await ValueLevel.identifyAstNodeData(astNode, context);
  expect(identifiedData.isSuccess).toBe(true);
  astNode.typedData = identifiedData.getValue();
  expect(astNode.dataType).toEqual(ValueTypeString.string);
  expect(astNode.data).toEqual(varValue)
});

// method call as a result
test('Supports the method call', async () => {
  const reflect = new Reflect();
  const projectMemory = getProjectMemory(reflect.nodeJsExt);
  const moduleMemory = getEmptyModule();
  await putFuncModule(reflect.nodeJsExt);

  const funcName = 'fooBar'
  const objName = 'CustomObj'
  const varName = 'greeting'
  const varValue = 10;

  let src = 
  `import { ${funcName} } from "${modulePath}";` +
  ` const ${objName} = {customMethod: ${funcName} }` +
  ` const ${varName}: number = CustomObj.customMethod('12345', '67890');`;

  let code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  let vars = await code.getVariableIdentifiers();

  let imports = await code.getImportedIdentifiers(projectMemory);
  expect(imports.isSuccess).toBe(true);
  moduleMemory.addIdentifiers(imports.getValue())
  let identified = await code.getLintedImportIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  let objAstNode = vars.getValue()[objName] as AstNode;
  expect(objAstNode.data).toBeInstanceOf(AraLink)
  expect(objAstNode.dataType).toBeUndefined()
  expect(CodeLink.isExpressionLink(objAstNode.data)).toBe(true)
  moduleMemory.addIdentifiers({[objAstNode.identifier!]: objAstNode})

  // We don't check the result, as previous tests must ensure its passing
  let astNode = vars.getValue()[varName] as AstNode;
  expect(astNode.data).toBeInstanceOf(AraLink)
  expect(astNode.dataType).toEqual(ValueTypeString.number)
  expect(CodeLink.isExpressionLink(astNode.data)).toBe(true)

  const context = new AstNodeContext([], moduleMemory.getIdentifiers(), projectMemory);
  const identifiedData = await ValueLevel.identifyAstNodeData(astNode, context);
  expect(identifiedData.isSuccess).toBe(true);
  astNode.typedData = identifiedData.getValue();
  expect(astNode.dataType).toEqual(ValueTypeString.number);
  expect(astNode.data).toEqual(varValue)
});

test('Supports the spread assignment through enums', async () => {
  const reflect = new Reflect();
  const projectMemory = getProjectMemory(reflect.nodeJsExt);
  const moduleMemory = getEmptyModule();
  await putFuncModule(reflect.nodeJsExt);

  const enumName = 'Sex'
  const profileName = 'profile'
  const varName = 'obj'

  let src = 
  ` import { ${enumName} } from "${modulePath}";` +
  ` const ${profileName} = {name: "Medet", sex: ${enumName}.Male}; ` +
   ` const ${varName} = {...profile} `;

  let code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  let vars = await code.getVariableIdentifiers();

  // Add imports and lint them.
  let imports = await code.getImportedIdentifiers(projectMemory);
  expect(imports.isSuccess).toBe(true);
  moduleMemory.addIdentifiers(imports.getValue())
  let identified = await code.getLintedImportIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // Profile check
  let profileAstNode = vars.getValue()[profileName] as AstNode;
  expect(profileAstNode.data).toBeInstanceOf(AraLink)
  expect(profileAstNode.dataType).toBeUndefined()
  expect(CodeLink.isExpressionLink(profileAstNode.data)).toBe(true)

  // Profile's data lint
  const context = new AstNodeContext([], moduleMemory.getIdentifiers(), projectMemory);
  const identifiedProfile = await ValueLevel.identifyAstNodeData(profileAstNode, context);
  expect(identifiedProfile.isSuccess).toBe(true);
  profileAstNode.typedData = identifiedProfile.getValue();
  context.post([profileAstNode])
  // Spread Assignment
  let astNode = vars.getValue()[varName] as AstNode;
  expect(astNode.data).toBeInstanceOf(AraLink)
  expect(astNode.dataType).toBeUndefined()
  expect(CodeLink.isExpressionLink(astNode.data)).toBe(true)

  // Spread Assignment data lint
  const identifiedData = await ValueLevel.identifyAstNodeData(astNode, context);
  expect(identifiedData.isSuccess).toBe(true);
  astNode.typedData = identifiedData.getValue();
  expect(astNode.dataType).toEqual(ValueTypeString.object);
  expect(astNode.data).toStrictEqual({ name: 'Medet', sex: 0 })
});

test('Supports the type from the imports', async () => {
  const reflect = new Reflect();
  const projectMemory = getProjectMemory(reflect.nodeJsExt);
  const moduleMemory = getEmptyModule();
  await putFuncModule(reflect.nodeJsExt);

  const typeName = 'CustomType'
  const profileName = 'profile'
  const varName = 'obj'

  let src = 
  ` import { type ${typeName} } from "${modulePath}";` +
  ` const ${profileName}: ${typeName} = {name: "Medet", sex: 0}; ` +
   ` const ${varName} = {...profile} `;

  let code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  let vars = await code.getVariableIdentifiers();

  // Add imports and lint them.
  let imports = await code.getImportedIdentifiers(projectMemory);
  expect(imports.isSuccess).toBe(true);
  moduleMemory.addIdentifiers(imports.getValue())
  let identified = await code.getLintedImportIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // Profile check
  let profileAstNode = vars.getValue()[profileName] as AstNode;
  expect(profileAstNode.data).toBeInstanceOf(AraLink)
  expect(profileAstNode.dataType).toBeInstanceOf(AraLink)
  expect(CodeLink.isExpressionLink(profileAstNode.data)).toBe(true)

  // Profile's data lint
  const context = new AstNodeContext([], moduleMemory.getIdentifiers(), projectMemory);
  const identifiedProfile = await ValueLevel.identifyAstNodeData(profileAstNode, context);
  expect(identifiedProfile.isSuccess).toBe(true);
  profileAstNode.typedData = identifiedProfile.getValue();
  context.post([profileAstNode])
  // Spread Assignment
  let astNode = vars.getValue()[varName] as AstNode;
  expect(astNode.data).toBeInstanceOf(AraLink)
  expect(astNode.dataType).toBeUndefined()
  expect(CodeLink.isExpressionLink(astNode.data)).toBe(true)

  // Spread Assignment data lint
  const identifiedData = await ValueLevel.identifyAstNodeData(astNode, context);
  expect(identifiedData.isSuccess).toBe(true);
  astNode.typedData = identifiedData.getValue();
  expect(astNode.dataType).toEqual(ValueTypeString.object);
  expect(astNode.data).toStrictEqual({ name: 'Medet', sex: 0 })
});

/*
AS Keyword but with local
`import { type CustomType } from "${modulePath}";` +
  ` const profile = {name: "Medet", sex: ${enumName}.Male}; ` +
   ` const ${varName} = {...profile} as CustomType`;
*/
test('Supports the type from the local type with `as` keyword', async () => {
  const reflect = new Reflect();
  const projectMemory = getProjectMemory(reflect.nodeJsExt);
  const moduleMemory = getEmptyModule();

  const typeName = 'CustomType'
  const profileName = 'profile'
  const varName = 'obj'

  let src = 
  ` export type ${typeName} = { name: string; sex: number };` +
  ` const ${profileName}: ${typeName} = {name: "Medet", sex: 1}; ` +
   ` const ${varName} = {...profile} as ${typeName}`;

  let code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  let vars = await code.getVariableIdentifiers();

  // Add types and lint them.
  let types = await code.getTypeIdentifiers();
  expect(types.isSuccess).toBe(true);
  moduleMemory.addIdentifiers(types.getValue())
  let identified = await code.getLintedTypeIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // Profile check
  let profileAstNode = vars.getValue()[profileName] as AstNode;
  expect(profileAstNode.data).toBeInstanceOf(AraLink)
  expect(profileAstNode.dataType).toBeInstanceOf(AraLink)
  expect(CodeLink.isExpressionLink(profileAstNode.data)).toBe(true)

  // Profile's data lint
  const context = new AstNodeContext([], moduleMemory.getIdentifiers(), projectMemory);
  const identifiedProfile = await ValueLevel.identifyAstNodeData(profileAstNode, context);
  expect(identifiedProfile.isSuccess).toBe(true);
  profileAstNode.typedData = identifiedProfile.getValue();
  context.post([profileAstNode])
  
  // Spread Assignment
  let astNode = vars.getValue()[varName] as AstNode;
  expect(astNode.data).toBeInstanceOf(AraLink)
  expect(astNode.dataType).toBeUndefined()
  expect(CodeLink.isExpressionLink(astNode.data)).toBe(true)
});

// Support with the UnionType
test('Supports the union types', async () => {
  const reflect = new Reflect();
  const projectMemory = getProjectMemory(reflect.nodeJsExt);
  const moduleMemory = getEmptyModule();

  const typeName = 'CustomType'
  const profileTypeName = 'ProfileType'
  const varName = 'obj'

  let src = 
  ` export type ${typeName} = { name: string; sex: number };` +
  ` export type ${profileTypeName} = ${typeName} | {surname: string}; ` +
   ` const ${varName}: ${profileTypeName} = {surname: 'Ahmetson'}`;

  let code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  let vars = await code.getVariableIdentifiers();

  // Add types and lint them.
  let types = await code.getTypeIdentifiers();
  expect(types.isSuccess).toBe(true);
  moduleMemory.addIdentifiers(types.getValue())
  let identified = await code.getLintedTypeIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // Type checks
  let profileAstNode = types.getValue()[profileTypeName] as AstNode;
  expect(profileAstNode.data).toBeInstanceOf(UnionTypeDeclaration)
  expect(profileAstNode.dataType).toBe(ValueTypeString.object)

  // Variable check
  let varAstNode = vars.getValue()[varName] as AstNode;
  expect(varAstNode.data).toBeInstanceOf(AraLink)
  expect(varAstNode.dataType).toBeInstanceOf(AraLink)
  expect(CodeLink.isExpressionLink(varAstNode.data)).toBe(true)

  // Variable's data lint
  const context = new AstNodeContext([], moduleMemory.getIdentifiers(), projectMemory);
  const identifiedProfile = await ValueLevel.identifyAstNodeData(varAstNode, context);
  expect(identifiedProfile.isSuccess).toBe(true);
  varAstNode.typedData = identifiedProfile.getValue();
  context.post([varAstNode])
});

// Support with the Intersected
test('Supports the intersected types', async () => {
  const reflect = new Reflect();
  const projectMemory = getProjectMemory(reflect.nodeJsExt);
  const moduleMemory = getEmptyModule();

  const typeName = 'CustomType'
  const profileTypeName = 'ProfileType'
  const varName = 'obj'

  let src = 
  ` export type ${typeName} = { name: string; sex: number };` +
  ` export type ${profileTypeName} = ${typeName} & {surname: string}; ` +
   ` const ${varName}: ${profileTypeName} = {'name': 'Medet', sex: -1, surname: 'Ahmetson'}`;

  let code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  let vars = await code.getVariableIdentifiers();

  // Add types and lint them.
  let types = await code.getTypeIdentifiers();
  expect(types.isSuccess).toBe(true);
  moduleMemory.addIdentifiers(types.getValue())
  let identified = await code.getLintedTypeIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // Type checks
  let profileAstNode = types.getValue()[profileTypeName] as AstNode;
  expect(profileAstNode.data).toBeInstanceOf(IntersectedUnionType)
  expect(profileAstNode.dataType).toBe(ValueTypeString.object)

  // Variable check
  let varAstNode = vars.getValue()[varName] as AstNode;
  expect(varAstNode.data).toBeInstanceOf(AraLink)
  expect(varAstNode.dataType).toBeInstanceOf(AraLink)
  expect(CodeLink.isExpressionLink(varAstNode.data)).toBe(true)

  // Variable's data lint
  const context = new AstNodeContext([], moduleMemory.getIdentifiers(), projectMemory);
  const identifiedProfile = await ValueLevel.identifyAstNodeData(varAstNode, context);
  expect(identifiedProfile.isSuccess).toBe(true);
  varAstNode.typedData = identifiedProfile.getValue();
  context.post([varAstNode])
});

test('Supports the arrays through Array generic', async () => {
  const reflect = new Reflect();
  const projectMemory = getProjectMemory(reflect.nodeJsExt);
  const moduleMemory = getEmptyModule();

  const typeName = 'CustomType'
  const varName = 'obj'

  let src = 
  ` export type ${typeName} = { name: string; sex: number };` +
   ` const ${varName}: Array<${typeName}> = [{'name': 'Medet', sex: 0}, {name: 'Brynn', sex: 1}]`;

  let code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  let vars = await code.getVariableIdentifiers();

  // Add types and lint them.
  let types = await code.getTypeIdentifiers();
  expect(types.isSuccess).toBe(true);
  moduleMemory.addIdentifiers(types.getValue())
  let identified = await code.getLintedTypeIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // Add built in types and lint them
  moduleMemory.addIdentifiers((await BuiltInIdentifiers.getBuiltInIdentifiers()).getValue())

  // Type checks
  let typeAstNode = types.getValue()[typeName] as AstNode;
  expect(typeAstNode.data).toBeInstanceOf(TypeDeclaration)
  expect(typeAstNode.dataType).toBe(ValueTypeString.object)

  // Variable check
  let varAstNode = vars.getValue()[varName] as AstNode;
  expect(varAstNode.data).toBeInstanceOf(AraLink)
  expect(varAstNode.dataType).toBeInstanceOf(AraLink)
  expect(CodeLink.isExpressionLink(varAstNode.data)).toBe(true)

  // Variable's data lint
  const context = new AstNodeContext([], moduleMemory.getIdentifiers(), projectMemory);
  const identifiedProfile = await ValueLevel.identifyAstNodeData(varAstNode, context);
  expect(identifiedProfile.isSuccess).toBe(true);
  varAstNode.typedData = identifiedProfile.getValue();
  context.post([varAstNode])
});

// Support of the arrays through the Array literals instead Generic Array
test('Supports the arrays through Array literals', async () => {
  const reflect = new Reflect();
  const projectMemory = getProjectMemory(reflect.nodeJsExt);
  const moduleMemory = getEmptyModule();

  const typeName = 'CustomType'
  const varName = 'obj'

  let src = 
  ` export type ${typeName} = { name: string; sex: number };` +
   ` const ${varName}: ${typeName}[] = [{'name': 'Medet', sex: 0}, {name: 'Brynn', sex: 1}]`;

  let code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  let vars = await code.getVariableIdentifiers();

  // Add types and lint them.
  let types = await code.getTypeIdentifiers();
  expect(types.isSuccess).toBe(true);
  moduleMemory.addIdentifiers(types.getValue())
  let identified = await code.getLintedTypeIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // Add built in types and lint them
  moduleMemory.addIdentifiers((await BuiltInIdentifiers.getBuiltInIdentifiers()).getValue())

  // Type checks
  let typeAstNode = types.getValue()[typeName] as AstNode;
  expect(typeAstNode.data).toBeInstanceOf(TypeDeclaration)
  expect(typeAstNode.dataType).toBe(ValueTypeString.object)

  // Variable check
  let varAstNode = vars.getValue()[varName] as AstNode;
  expect(varAstNode.data).toBeInstanceOf(AraLink)
  expect(Array.isArray(varAstNode.dataType)).toBe(true)
  expect((varAstNode.dataType as Array<any>)[0]).toBeInstanceOf(AraLink)
  expect(CodeLink.isExpressionLink(varAstNode.data)).toBe(true)

  // Variable's data lint
  const context = new AstNodeContext([], moduleMemory.getIdentifiers(), projectMemory);
  const identifiedProfile = await ValueLevel.identifyAstNodeData(varAstNode, context);
  expect(identifiedProfile.isSuccess).toBe(true);
  varAstNode.typedData = identifiedProfile.getValue();
  context.post([varAstNode])
});

// Support array with the primitive types
test('Supports the arrays with primitive types', async () => {
  const reflect = new Reflect();
  const projectMemory = getProjectMemory(reflect.nodeJsExt);
  const moduleMemory = getEmptyModule();

  const typeName = 'string'
  const varName = 'names'

  let src = ` const ${varName}: ${typeName}[] = ['Medet', 'Brynn']`;

  let code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  let vars = await code.getVariableIdentifiers();

  // Add built in types and lint them
  moduleMemory.addIdentifiers((await BuiltInIdentifiers.getBuiltInIdentifiers()).getValue())

  // Variable check
  let varAstNode = vars.getValue()[varName] as AstNode;
  expect(varAstNode.data).toBeInstanceOf(AraLink)
  expect(Array.isArray(varAstNode.dataType)).toBe(true)
  expect((varAstNode.dataType as Array<any>)[0]).toBe(ValueTypeString.string)
  expect(CodeLink.isExpressionLink(varAstNode.data)).toBe(true)

  // Variable's data lint
  const context = new AstNodeContext([], moduleMemory.getIdentifiers(), projectMemory);
  const identifiedProfile = await ValueLevel.identifyAstNodeData(varAstNode, context);
  expect(identifiedProfile.isSuccess).toBe(true);
  varAstNode.typedData = identifiedProfile.getValue();
  context.post([varAstNode])
});

// Support array with the primitive types
test('Supports the shorthand project assign with primitive types', async () => {
  const reflect = new Reflect();
  const projectMemory = getProjectMemory(reflect.nodeJsExt);
  const moduleMemory = getEmptyModule();

  const typeName = 'CustomType'
  const propertyName = 'name'
  const varName = 'names'

  let src = ` export type ${typeName} = { ${propertyName}: string; sex: number };` +
    ` const ${propertyName} = 'Medet'; ` +
    ` const ${varName}: ${typeName} = {${propertyName}, sex: 1}`;

  let code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  let vars = await code.getVariableIdentifiers();

  // Add types and lint them.
  let types = await code.getTypeIdentifiers();
  expect(types.isSuccess).toBe(true);
  moduleMemory.addIdentifiers(types.getValue())
  let identified = await code.getLintedTypeIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // Type checks
  let typeNode = types.getValue()[typeName] as AstNode;
  expect(typeNode.data).toBeInstanceOf(TypeDeclaration)
  expect(typeNode.dataType).toBe(ValueTypeString.object)

  // Add built in types and lint them
  moduleMemory.addIdentifiers((await BuiltInIdentifiers.getBuiltInIdentifiers()).getValue())
  moduleMemory.addIdentifiers({[propertyName]: vars.getValue()[propertyName]})

  // Variable check
  let varAstNode = vars.getValue()[varName] as AstNode;
  expect(varAstNode.data).toBeInstanceOf(AraLink)
  expect(varAstNode.dataType).toBeInstanceOf(AraLink)
  expect(CodeLink.isExpressionLink(varAstNode.data)).toBe(true)

  // Variable's data lint
  const context = new AstNodeContext([], moduleMemory.getIdentifiers(), projectMemory);
  const identifiedProfile = await ValueLevel.identifyAstNodeData(varAstNode, context);
  expect(identifiedProfile.isSuccess).toBe(true);
  varAstNode.typedData = identifiedProfile.getValue();
  context.post([varAstNode])
});

// Support array with the primitive types
test('Supports the parenthesis', async () => {
  const reflect = new Reflect();
  const projectMemory = getProjectMemory(reflect.nodeJsExt);
  const moduleMemory = getEmptyModule();

  const typeName = 'CustomType'
  const propertyName = 'name'
  const varName = 'names'

  let src = 
    ` export type ${typeName} = { ${propertyName}: string; sex: number };` +
    ` const ${varName}: ${typeName} = ({${propertyName}: 'Medet', sex: +1})`;

  let code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  let vars = await code.getVariableIdentifiers();

  // Add types and lint them.
  let types = await code.getTypeIdentifiers();
  expect(types.isSuccess).toBe(true);
  moduleMemory.addIdentifiers(types.getValue())
  let identified = await code.getLintedTypeIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // Type checks
  let typeNode = types.getValue()[typeName] as AstNode;
  expect(typeNode.data).toBeInstanceOf(TypeDeclaration)
  expect(typeNode.dataType).toBe(ValueTypeString.object)

  // Add built in types and lint them
  moduleMemory.addIdentifiers((await BuiltInIdentifiers.getBuiltInIdentifiers()).getValue())
  moduleMemory.addIdentifiers({[propertyName]: vars.getValue()[propertyName]})

  // Variable check
  let varAstNode = vars.getValue()[varName] as AstNode;
  expect(varAstNode.data).toBeInstanceOf(AraLink)
  expect(varAstNode.dataType).toBeInstanceOf(AraLink)
  expect(CodeLink.isExpressionLink(varAstNode.data)).toBe(true)

  // Variable's data lint
  const context = new AstNodeContext([], moduleMemory.getIdentifiers(), projectMemory);
  const identifiedProfile = await ValueLevel.identifyAstNodeData(varAstNode, context);
  expect(identifiedProfile.isSuccess).toBe(true);
  varAstNode.typedData = identifiedProfile.getValue();
  context.post([varAstNode])
});

test('Supports the conditional expression', async () => {
  const reflect = new Reflect();
  const projectMemory = getProjectMemory(reflect.nodeJsExt);
  const moduleMemory = getEmptyModule();

  const typeName = 'CustomType'
  const propertyName = 'name'
  const varName = 'names'
  const trueCondition = '1';
  const falseCondition = '-2';

  let src = 
    ` export type ${typeName} = { ${propertyName}: string; sex: number };` +
    ` const data = ${trueCondition}; ` +
    ` const ${varName} = data === 1 ? ({${propertyName}: 'Medet', sex: +1}) : 'Not found'`;
  let code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  let vars = await code.getVariableIdentifiers();

  // Add types and lint them.
  let types = await code.getTypeIdentifiers();
  expect(types.isSuccess).toBe(true);
  moduleMemory.addIdentifiers(types.getValue())
  let identified = await code.getLintedTypeIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // Type checks
  let typeNode = types.getValue()[typeName] as AstNode;
  expect(typeNode.data).toBeInstanceOf(TypeDeclaration)
  expect(typeNode.dataType).toBe(ValueTypeString.object)

  // Add built in types and lint them
  moduleMemory.addIdentifiers((await BuiltInIdentifiers.getBuiltInIdentifiers()).getValue())
  moduleMemory.addIdentifiers({'data': vars.getValue()['data']})

  // Variable check
  let varAstNode = vars.getValue()[varName] as AstNode;
  expect(varAstNode.data).toBeInstanceOf(AraLink)
  expect(varAstNode.dataType).toBeUndefined()
  expect(CodeLink.isExpressionLink(varAstNode.data)).toBe(true)

  // Variable's data lint
  let context = new AstNodeContext([], moduleMemory.getIdentifiers(), projectMemory);
  let identifiedProfile = await ValueLevel.identifyAstNodeData(varAstNode, context);
  expect(identifiedProfile.isSuccess).toBe(true);
  varAstNode.typedData = identifiedProfile.getValue();
  expect(varAstNode.data).toStrictEqual({ name: 'Medet', sex: 1 })
  expect(varAstNode.dataType).toEqual(ValueTypeString.object)
  context.post([varAstNode])

  //
  // False check
  //
  src = 
  ` export type ${typeName} = { ${propertyName}: string; sex: number };` +
  ` const data = ${falseCondition}; ` +
  ` const ${varName} = data === 1 ? ({${propertyName}: 'Medet', sex: +1}) : 'Not found'`;
  code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  vars = await code.getVariableIdentifiers();

  // Add types and lint them.
  types = await code.getTypeIdentifiers();
  expect(types.isSuccess).toBe(true);
  moduleMemory.addIdentifiers(types.getValue())
  identified = await code.getLintedTypeIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // Type checks
  typeNode = types.getValue()[typeName] as AstNode;
  expect(typeNode.data).toBeInstanceOf(TypeDeclaration)
  expect(typeNode.dataType).toBe(ValueTypeString.object)

  // Add built in types and lint them
  moduleMemory.addIdentifiers((await BuiltInIdentifiers.getBuiltInIdentifiers()).getValue())
  moduleMemory.addIdentifiers({'data': vars.getValue()['data']})

  // Variable check
  varAstNode = vars.getValue()[varName] as AstNode;
  expect(varAstNode.data).toBeInstanceOf(AraLink)
  expect(varAstNode.dataType).toBeUndefined()
  expect(CodeLink.isExpressionLink(varAstNode.data)).toBe(true)

  // Variable's data lint
  context = new AstNodeContext([], moduleMemory.getIdentifiers(), projectMemory);
  identifiedProfile = await ValueLevel.identifyAstNodeData(varAstNode, context);
  expect(identifiedProfile.isSuccess).toBe(true);
  varAstNode.typedData = identifiedProfile.getValue();
  expect(varAstNode.data).toStrictEqual('Not found')
  expect(varAstNode.dataType).toEqual(ValueTypeString.string)
  context.post([varAstNode])

});


// TODO #1
// cancelSlug when identifying !cancelSlug is not working.
// As its the infinite recursive loop (!cancelSlug -> cancelSlug -> !canSlug by updateFunction)
// Therefore, identify the variables in the module.
// identify their assignment.
            
// First identify the variables then update the variables by the given identifier.
// And the update variable is accesses the memory.
            
// TODO #2
// Identify the imports in the memory.
// Identify the imports as newName,
// identify the type imports,
// identify the type { name, name },
// identify the default, and in the skobes,
// Then, change recursiveValue by the value.


//
// Check the variable updates
//

// Check the functions that update the variable?