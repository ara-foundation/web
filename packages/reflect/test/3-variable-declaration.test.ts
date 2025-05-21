import { expect, test } from "vitest";
import { Code } from "../src/code-level/code.js";
import { CodePieceType } from "../src/code-level/code-piece.js";
import { IntersectedUnionType, UserTypeDeclaration, UnionTypeDeclaration, ValueTypeString } from "../src/code-level/code-piece-types.js";
import { AraLink, ModuleLink } from "@ara-web/sds";
import { Node } from "ts-morph";
import { ReflectLink } from "../src/code-level/reflect-link.js";
import { Reflect } from "../src/reflect.js"
import { expectAstNodeResult, expectValidVariableNode, getEmptyContext, getEmptyModule, getProjectMemory, modulePath, putFuncModule, type AstNodeProperties } from "./shared.js";
import { CodePieceContext } from "../src/code-level/code-piece-context.js";
import { ValueLevel } from "../src/code-level/value-level/index.js";
import { BuiltInIdentifiers } from "../src/built-in-identifiers.js";
import { MODULE_SELECTOR } from "../src/code-piece-object-tree.js";
import { TypeLevel } from "../src/code-level/index.js";

const reflectingPkgUrl = ModuleLink.newPackageURL("@ara-web", "var-declaration-test")

// const parentUrl = "/ara/act/ara-web/action/get";
test('Supports the simple variable declaration as public, export keywords too', async () => {
  const varName = 'parentUrl'
  const varValue = "/ara/act/ara-web/action/get";
  let src = `const ${varName} = "${varValue}"`;
  let code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  let vars = await code.getVariableIdentifiers();

  // Result
  expectAstNodeResult(vars, varName);
  let astNode = vars.getValue().find(codePiece => codePiece.identifier === varName)!;

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
  astNode = vars.getValue().find(codePiece => codePiece.identifier === varName)!;

  expectedProps.constant = false;
  expectValidVariableNode(astNode, varName, expectedProps);

  // Export and constant
  src = `export const ${varName} = "${varValue}"`;
  code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  vars = await code.getVariableIdentifiers();
  expectAstNodeResult(vars, varName)
  astNode = vars.getValue().find(codePiece => codePiece.identifier === varName)!;

  expectedProps.constant = true;
  expectedProps.public = true;
  expectValidVariableNode(astNode, varName, expectedProps);

  // Data undefined
  src = `export let ${varName};`;
  code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  vars = await code.getVariableIdentifiers();
  expectAstNodeResult(vars, varName);
  astNode = vars.getValue().find(codePiece => codePiece.identifier === varName)!;

  expectedProps.constant = false;
  expectedProps.public = true;
  expectValidVariableNode(astNode, varName, expectedProps);
  expect(astNode.data).toBeUndefined();
});

// const { slug } = Astro.params;
test('Supports the variable declaration derived from the object decoupling', async () => {
  const varName = 'slug'
  const varValue = "Astro.params";
  const src = `const { ${varName} } = "${varValue}"`;
  const code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  const vars = await code.getVariableIdentifiers();
  // Result
  expectAstNodeResult(vars, varName)
  const astNode = vars.getValue().find(codePiece => codePiece.identifier === varName)!;

  let expectedProps: AstNodeProperties = {
    constant: true,
    public: false
  }
  expectValidVariableNode(astNode, varName, expectedProps);

  // The Ast node's data must be a link to the identifier
  expect(ReflectLink.isIdentifierLink(astNode.data as AraLink<string>)).toBe(true)
  expect((astNode.data as AraLink<string>).resource).toBe(varName)

  // The Ast node's binding should a property of the expression
  expect(astNode.memoryDataLength()).toEqual(1)
  expect(astNode.getMemoryData(0)?.identifier).toBe(varName)
  expect(ReflectLink.isTsNodeLink(astNode.getMemoryData(0)?.data as AraLink<Node>)).toBe(true)
  expect(astNode.getMemoryData(0)?.nodeType).toBe(CodePieceType.Property)
  expect(astNode.getMemoryData(0)?.dataType).toBeUndefined();
});

// Decoupling with a new name.
// const { slug: derivedSlug } = Astro.params;
test('Supports the variable declaration by alias derived from the object decoupling', async () => {
  const varName = 'derivedSlug'
  const propertyName = 'slug'
  const varValue = "Astro.params";
  const src = `const { ${propertyName}: ${varName} } = "${varValue}"`;
  const code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  const vars = await code.getVariableIdentifiers();
  // Result
  expectAstNodeResult(vars, varName)
  const astNode = vars.getValue().find(codePiece => codePiece.identifier === varName)!;

  let expectedProps: AstNodeProperties = {
    constant: true,
    public: false
  }
  expectValidVariableNode(astNode, varName, expectedProps);

  // The Ast node's data must be a link to the identifier
  expect(ReflectLink.isIdentifierLink(astNode.data as AraLink<string>)).toBe(true)
  expect((astNode.data as AraLink<string>).resource).toBe(propertyName)

  // The Ast node's binding should a property of the expression
  expect(astNode.memoryDataLength()).toEqual(1)
  expect(astNode.getMemoryData(0)?.identifier).toBe(propertyName)
  expect(ReflectLink.isTsNodeLink(astNode.getMemoryData(0)?.data as AraLink<Node>)).toBe(true)
  expect(astNode.getMemoryData(0)?.nodeType).toBe(CodePieceType.Property)
  expect(astNode.getMemoryData(0)?.dataType).toBeUndefined();
});

// const action: Action | undefined = getActionBySlug(slug);
test('Supports the simple variable declaration as public, export keywords too', async () => {
  const varName = 'action'
  const varValue = "getActionBySlug(slug)";
  let src = `const ${varName}: Action | undefined = ${varValue}`;
  let code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  let vars = await code.getVariableIdentifiers();

  // Result
  expectAstNodeResult(vars, varName);
  let astNode = vars.getValue().find(codePiece => codePiece.identifier === varName)!;

  let expectedProps: AstNodeProperties = {
    constant: true,
    public: false
  }
  expectValidVariableNode(astNode, varName, expectedProps, UnionTypeDeclaration);
  
  // Node Data
  const data = astNode.dataType as UnionTypeDeclaration;
  expect(data.unionLength).toEqual(2)
  expect(ReflectLink.isIdentifierLink(data.getUnion(0) as AraLink<string>)).toBe(true)
  expect((data.getUnion(0) as AraLink<string>).resource).toEqual('Action')
  expect(data.getUnion(1)).toEqual(ValueTypeString.undefined)
});

// const data: Array<string> = func<string>();
test('Supports the the variable declaration with the generic value', async () => {
  const varName = 'data'
  const varValue = "func<string>()";
  let src = `const ${varName}: Array<string> = ${varValue}`;
  let code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  let vars = await code.getVariableIdentifiers();

  // Result
  expectAstNodeResult(vars, varName)
  let astNode = vars.getValue().find(codePiece => codePiece.identifier === varName)!;

  let expectedProps: AstNodeProperties = {
    constant: true,
    public: false
  }
  expectValidVariableNode(astNode, varName, expectedProps, AraLink);
  
  // Node Data
  const data = astNode.dataType as AraLink<string>;
  expect(ReflectLink.isIdentifierLink(data)).toBe(true)
  expect(data.isPropertyExist(TypeLevel.GENERIC_VALUES_LINK_PROPERTY)).toBe(true);
  const genericProps = TypeLevel.linkPropertyToGenericValues(data);
  expect(genericProps).toHaveLength(1);
  expect(genericProps[0]).toEqual(ValueTypeString.string)
});

///////////////////////////////////////////////////////////////////////////////////////////////////
//
// Variable Linting
//
///////////////////////////////////////////////////////////////////////////////////////////////////

// const parentUrl = "/ara/act/ara-web/action/get";
test('Supports the literal value assignment', async () => {
  const varName = 'parentUrl'
  const varValue = "/ara/act/ara-web/action/get";
  let src = `const ${varName} = "${varValue}"`;
  let code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  let vars = await code.getVariableIdentifiers();

  // We don't check the result, as previous tests must ensure its passing
  let astNode = vars.getValue().find(codePiece => codePiece.identifier === varName)!;

  expect(astNode.data).toBeInstanceOf(AraLink)
  expect(ReflectLink.isTsNodeLink(astNode.data)).toBe(true)

  const context = getEmptyContext();
  const identifiedData = await ValueLevel.identifyAstNodeData(astNode, context);
  expect(identifiedData.isSuccess).toBe(true);
  astNode.typedData = identifiedData.getValue();
  expect(astNode.dataType).toEqual(ValueTypeString.string);
  expect(astNode.data).toEqual(varValue)
});

// const obj = { slug: "Astro.params" }
// const { slug } = obj;
test('Supports the linting variable parameter from object decoupling', async () => {
  const varName = 'slug'
  const src = 
    `const obj = { slug: "Astro.params" }` +
    `const { slug } = obj`
  ;
  const code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  const vars = await code.getVariableIdentifiers();
  // Result
  expectAstNodeResult(vars, varName)
  const astNode = vars.getValue().find(codePiece => codePiece.identifier === varName)!;

  let expectedProps: AstNodeProperties = {
    constant: true,
    public: false
  }
  expectValidVariableNode(astNode, varName, expectedProps);

  // The Ast node's data must be a link to the identifier
  expect(ReflectLink.isIdentifierLink(astNode.data as AraLink<string>)).toBe(true)
  expect((astNode.data as AraLink<string>).resource).toBe(varName)

  // The Ast node's binding should a property of the expression
  expect(astNode.isObjectBinding()).toBe(true)
  expect(astNode.getBindedObject()?.dataType).toBeUndefined();
  expect(astNode.getBindedObject()?.identifier).toBe('slug')
  expect(ReflectLink.isTsNodeLink(astNode.getBindedObject()?.data as AraLink<Node>)).toBe(true)

  // Linting
  const reflect = new Reflect({packageLink: reflectingPkgUrl});
  const projectMemory = getProjectMemory(reflect.nodeJsExt);
  const moduleMemory = getEmptyModule();
  await putFuncModule(reflect.nodeJsExt);

  const objectName = 'obj'
  const objectAstNode = vars.getValue().find(codePiece => codePiece.identifier === objectName);
  expect(objectAstNode !== undefined).toBe(true);
  const posted = moduleMemory.rest.post!('*', objectAstNode!, {});
  expect(posted.isSuccess).toBe(true);
  
  const context = new CodePieceContext(astNode.getAllMemoryData(), moduleMemory.rest.getAll!(MODULE_SELECTOR).map(node => node.getElement()!), projectMemory);
  const identifiedData = await ValueLevel.identifyAstNodeData(astNode, context);
  expect(identifiedData.isSuccess).toBe(true);
  astNode.typedData = identifiedData.getValue();
  expect(astNode.dataType).toEqual(ValueTypeString.string);
  expect("Astro.params").toEqual(astNode.data)
});


// import { fooBar } from "./funcs.ts"
// const fooBar = fooBar('medet', 'ahmetson');
//
// To work with function result, we need to create a function declaration.
// function call as a result.
test('Supports the function call as variable value', async () => {
  const reflect = new Reflect({packageLink: reflectingPkgUrl});
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
  
  imports.getValue().forEach((importedCodePiece) => {
      const posted = moduleMemory.rest.post!('*', importedCodePiece, {});
      expect(posted.isSuccess).toBe(true);
  });
  let identified = await code.getLintedImportIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // We don't check the result, as previous tests must ensure its passing
  let astNode = vars.getValue().find(codePiece => codePiece.identifier === varName)!;

  expect(astNode.data).toBeInstanceOf(AraLink)
  expect(astNode.dataType).toBeUndefined();
  expect(ReflectLink.isTsNodeLink(astNode.data)).toBe(true)

  const context = new CodePieceContext([], moduleMemory.rest.getAll!(MODULE_SELECTOR).map(node => node.getElement()!), projectMemory);
  const identifiedData = await ValueLevel.identifyAstNodeData(astNode, context);
  expect(identifiedData.isSuccess).toBe(true);
  astNode.typedData = identifiedData.getValue();
  expect(astNode.dataType).toEqual(ValueTypeString.number);
  expect(('medet' + 'ahmetson')).toHaveLength(astNode.data as number)
});

// import { fooBar } from "./funcs.ts"
// const fooBar = fooBar('medet', 'ahmetson');
//
// function call, but variable has defined type such as string
// but function returns another type.
test('Supports the function call as variable value but mismatch the types', async () => {
  const reflect = new Reflect({packageLink: reflectingPkgUrl});
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
  imports.getValue().forEach((importedCodePiece) => {
      const posted = moduleMemory.rest.post!('*', importedCodePiece, {});
      expect(posted.isSuccess).toBe(true);
  });
  
  let identified = await code.getLintedImportIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // We don't check the result, as previous tests must ensure its passing
  let astNode = vars.getValue().find(codePiece => codePiece.identifier === varName)!;

  expect(astNode.data).toBeInstanceOf(AraLink)
  expect(astNode.dataType).toEqual(ValueTypeString.string)
  expect(ReflectLink.isTsNodeLink(astNode.data)).toBe(true)

  const context = new CodePieceContext([], moduleMemory.rest.getAll!(MODULE_SELECTOR).map(node => node.getElement()!), projectMemory);
  const identifiedData = await ValueLevel.identifyAstNodeData(astNode, context);
  expect(identifiedData.isSuccess).toBe(false);
});

// import { helloAndWelcome } from "./funcs.ts"
// const greeting: string = helloAndWelcome();
//
// function call without any argument
test('Supports the function call without any argument', async () => {
  const reflect = new Reflect({packageLink: reflectingPkgUrl});
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
  imports.getValue().forEach((importedCodePiece) => {
      const posted = moduleMemory.rest.post!('*', importedCodePiece, {});
      expect(posted.isSuccess).toBe(true);
  });
  
  
  let identified = await code.getLintedImportIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // We don't check the result, as previous tests must ensure its passing
  let astNode = vars.getValue().find(codePiece => codePiece.identifier === varName)!;

  expect(astNode.data).toBeInstanceOf(AraLink)
  expect(astNode.dataType).toEqual(ValueTypeString.string)
  expect(ReflectLink.isTsNodeLink(astNode.data)).toBe(true)

  const context = new CodePieceContext([], moduleMemory.rest.getAll!(MODULE_SELECTOR).map(node => node.getElement()!), projectMemory);
  const identifiedData = await ValueLevel.identifyAstNodeData(astNode, context);
  expect(identifiedData.isSuccess).toBe(true);
  astNode.typedData = identifiedData.getValue();
  expect(astNode.dataType).toEqual(ValueTypeString.string);
  expect(astNode.data).toEqual(varValue)
});

// import { fooBar } from "./funcs.ts"
// const CustomObj = {customMethod: fooBar }
// const greeting: number = CustomObj.customMethod('12345', '67890');
//
// method call as a result
test('Supports the method call', async () => {
  const reflect = new Reflect({packageLink: reflectingPkgUrl});
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
  imports.getValue().forEach((importedCodePiece) => {
      const posted = moduleMemory.rest.post!('*', importedCodePiece, {});
      expect(posted.isSuccess).toBe(true);
  });
  
  let identified = await code.getLintedImportIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  let objAstNode = vars.getValue().find(codePiece => codePiece.identifier === objName)!;

  expect(objAstNode.data).toBeInstanceOf(AraLink)
  expect(objAstNode.dataType).toBeUndefined()
  expect(ReflectLink.isTsNodeLink(objAstNode.data)).toBe(true)
  moduleMemory.rest.post!('*', objAstNode, {})

  // We don't check the result, as previous tests must ensure its passing
  let astNode = vars.getValue().find(codePiece => codePiece.identifier === varName)!;

  expect(astNode.data).toBeInstanceOf(AraLink)
  expect(astNode.dataType).toEqual(ValueTypeString.number)
  expect(ReflectLink.isTsNodeLink(astNode.data)).toBe(true)

  const context = new CodePieceContext([], moduleMemory.rest.getAll!(MODULE_SELECTOR).map(node => node.getElement()!), projectMemory);
  const identifiedData = await ValueLevel.identifyAstNodeData(astNode, context);
  expect(identifiedData.isSuccess).toBe(true);
  astNode.typedData = identifiedData.getValue();
  expect(astNode.dataType).toEqual(ValueTypeString.number);
  expect(astNode.data).toEqual(varValue)
});

// import { Sex } from "./funcs.ts"
// const profile = {name: "Medet", sex: Sex.Male}
// const obj = {...profile};
test('Supports the spread assignment through enums', async () => {
  const reflect = new Reflect({packageLink: reflectingPkgUrl});
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
  imports.getValue().forEach((importedCodePiece) => {
      const posted = moduleMemory.rest.post!('*', importedCodePiece, {});
      expect(posted.isSuccess).toBe(true);
  });
  
  let identified = await code.getLintedImportIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // Profile check
  let profileAstNode = vars.getValue().find(codePiece => codePiece.identifier === profileName)!;

  expect(profileAstNode.data).toBeInstanceOf(AraLink)
  expect(profileAstNode.dataType).toBeUndefined()
  expect(ReflectLink.isTsNodeLink(profileAstNode.data)).toBe(true)

  // Profile's data lint
  const context = new CodePieceContext([], moduleMemory.rest.getAll!(MODULE_SELECTOR).map(node => node.getElement()!), projectMemory);
  const identifiedProfile = await ValueLevel.identifyAstNodeData(profileAstNode, context);
  expect(identifiedProfile.isSuccess).toBe(true);
  profileAstNode.typedData = identifiedProfile.getValue();
  context.post([profileAstNode])
  // Spread Assignment
  let astNode = vars.getValue().find(codePiece => codePiece.identifier === varName)!;

  expect(astNode.data).toBeInstanceOf(AraLink)
  expect(astNode.dataType).toBeUndefined()
  expect(ReflectLink.isTsNodeLink(astNode.data)).toBe(true)

  // Spread Assignment data lint
  const identifiedData = await ValueLevel.identifyAstNodeData(astNode, context);
  expect(identifiedData.isSuccess).toBe(true);
  astNode.typedData = identifiedData.getValue();
  expect(astNode.dataType).toEqual(ValueTypeString.object);
  expect(astNode.data).toStrictEqual({ name: 'Medet', sex: 0 })
});

// import { type CustomType } from "./funcs.ts"
// const profile = {name: "Medet", sex: 0}
// const obj = {...profile};
test('Supports the type from the imports', async () => {
  const reflect = new Reflect({packageLink: reflectingPkgUrl});
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
  imports.getValue().forEach((importedCodePiece) => {
      const posted = moduleMemory.rest.post!('*', importedCodePiece, {});
      expect(posted.isSuccess).toBe(true);
  });
    
  let identified = await code.getLintedImportIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // Profile check
  let profileAstNode = vars.getValue().find(codePiece => codePiece.identifier === profileName)!;

  expect(profileAstNode.data).toBeInstanceOf(AraLink)
  expect(profileAstNode.dataType).toBeInstanceOf(AraLink)
  expect(ReflectLink.isTsNodeLink(profileAstNode.data)).toBe(true)

  // Profile's data lint
  const context = new CodePieceContext([], moduleMemory.rest.getAll!(MODULE_SELECTOR).map(node => node.getElement()!), projectMemory);
  const identifiedProfile = await ValueLevel.identifyAstNodeData(profileAstNode, context);
  expect(identifiedProfile.isSuccess).toBe(true);
  profileAstNode.typedData = identifiedProfile.getValue();
  context.post([profileAstNode])
  // Spread Assignment
  let astNode = vars.getValue().find(codePiece => codePiece.identifier === varName)!;

  expect(astNode.data).toBeInstanceOf(AraLink)
  expect(astNode.dataType).toBeUndefined()
  expect(ReflectLink.isTsNodeLink(astNode.data)).toBe(true)

  // Spread Assignment data lint
  const identifiedData = await ValueLevel.identifyAstNodeData(astNode, context);
  expect(identifiedData.isSuccess).toBe(true);
  astNode.typedData = identifiedData.getValue();
  expect(astNode.dataType).toEqual(ValueTypeString.object);
  expect(astNode.data).toStrictEqual({ name: 'Medet', sex: 0 })
});

// export type CustomType = {name: string, sex: number}
// const profile: CustomType = {name: "Medet", sex: 1}
// const obj = {...profile} as CustomType;
test('Supports the type from the local type with `as` keyword', async () => {
  const reflect = new Reflect({packageLink: reflectingPkgUrl});
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
  types.getValue().forEach((importedCodePiece) => {
      const posted = moduleMemory.rest.post!('*', importedCodePiece, {});
      expect(posted.isSuccess).toBe(true);
  });
  
  
  let identified = await code.getLintedTypeIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // Profile check
  let profileAstNode = vars.getValue().find(codePiece => codePiece.identifier === profileName)!;

  expect(profileAstNode.data).toBeInstanceOf(AraLink)
  expect(profileAstNode.dataType).toBeInstanceOf(AraLink)
  expect(ReflectLink.isTsNodeLink(profileAstNode.data)).toBe(true)

  // Profile's data lint
  const context = new CodePieceContext([], moduleMemory.rest.getAll!(MODULE_SELECTOR).map(node => node.getElement()!), projectMemory);
  const identifiedProfile = await ValueLevel.identifyAstNodeData(profileAstNode, context);
  expect(identifiedProfile.isSuccess).toBe(true);
  profileAstNode.typedData = identifiedProfile.getValue();
  context.post([profileAstNode])
  
  // Spread Assignment
  let astNode = vars.getValue().find(codePiece => codePiece.identifier === varName)!;

  expect(astNode.data).toBeInstanceOf(AraLink)
  expect(astNode.dataType).toBeUndefined()
  expect(ReflectLink.isTsNodeLink(astNode.data)).toBe(true)
});

// export type CustomType = {name: string, sex: number}
// const profile: ProfileType = {name: "Medet", sex: 1} | {surname: string}
// const obj: ProfileType = {surname: 'Ahmetson'}
//
// Support with the UnionType
test('Supports the union types', async () => {
  const reflect = new Reflect({packageLink: reflectingPkgUrl});
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
  types.getValue().forEach((importedCodePiece) => {
      const posted = moduleMemory.rest.post!('*', importedCodePiece, {});
      expect(posted.isSuccess).toBe(true);
  });
  
  
  let identified = await code.getLintedTypeIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // Type checks
  let profileAstNode = types.getValue().find(codePiece => codePiece.identifier === profileTypeName)!;

  expect(profileAstNode.data).toBeInstanceOf(UnionTypeDeclaration)
  expect(profileAstNode.dataType).toBe(ValueTypeString.object)

  // Variable check
  let varAstNode = vars.getValue().find(codePiece => codePiece.identifier === varName)!;

  expect(varAstNode.data).toBeInstanceOf(AraLink)
  expect(varAstNode.dataType).toBeInstanceOf(AraLink)
  expect(ReflectLink.isTsNodeLink(varAstNode.data)).toBe(true)

  // Variable's data lint
  const context = new CodePieceContext([], moduleMemory.rest.getAll!(MODULE_SELECTOR).map(node => node.getElement()!), projectMemory);
  const identifiedProfile = await ValueLevel.identifyAstNodeData(varAstNode, context);
  expect(identifiedProfile.isSuccess).toBe(true);
  varAstNode.typedData = identifiedProfile.getValue();
  context.post([varAstNode])
});

// export type CustomType = {name: string, sex: number}
// const profile: ProfileType = {name: "Medet", sex: 1} & {surname: string}
// const obj: ProfileType = {'name': 'Medet', sex: -1, surname: 'Ahmetson'}
//
// Support with the Intersected
test('Supports the intersected types', async () => {
  const reflect = new Reflect({packageLink: reflectingPkgUrl});
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
  types.getValue().forEach((importedCodePiece) => {
      const posted = moduleMemory.rest.post!('*', importedCodePiece, {});
      expect(posted.isSuccess).toBe(true);
  });
  
  let identified = await code.getLintedTypeIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // Type checks
  let profileAstNode = types.getValue().find(codePiece => codePiece.identifier === profileTypeName)!;

  expect(profileAstNode.data).toBeInstanceOf(IntersectedUnionType)
  expect(profileAstNode.dataType).toBe(ValueTypeString.object)

  // Variable check
  let varAstNode = vars.getValue().find(codePiece => codePiece.identifier === varName)!;

  expect(varAstNode.data).toBeInstanceOf(AraLink)
  expect(varAstNode.dataType).toBeInstanceOf(AraLink)
  expect(ReflectLink.isTsNodeLink(varAstNode.data)).toBe(true)

  // Variable's data lint
  const context = new CodePieceContext([], moduleMemory.rest.getAll!(MODULE_SELECTOR).map(node => node.getElement()!), projectMemory);
  const identifiedProfile = await ValueLevel.identifyAstNodeData(varAstNode, context);
  expect(identifiedProfile.isSuccess).toBe(true);
  varAstNode.typedData = identifiedProfile.getValue();
  context.post([varAstNode])
});

// export type CustomType = {name: string, sex: number}
// const obj: Array<CustomType> = [{name: 'Medet', sex:0, surname: 'Ahmetson'}, {name: 'Brynn', sex: 1}];
test('Supports the arrays through Array generic', async () => {
  const reflect = new Reflect({packageLink: reflectingPkgUrl});
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
  types.getValue().forEach((importedCodePiece) => {
      const posted = moduleMemory.rest.post!('*', importedCodePiece, {});
      expect(posted.isSuccess).toBe(true);
  });
  
  let identified = await code.getLintedTypeIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // Add built in types and lint them
  (await BuiltInIdentifiers.getBuiltInIdentifiers()).getValue().forEach((importedCodePiece) => {
    const posted = moduleMemory.rest.post!('*', importedCodePiece, {});
    expect(posted.isSuccess).toBe(true);   
  })

  // Type checks
  let typeAstNode = types.getValue().find(codePiece => codePiece.identifier === typeName)!;

  expect(typeAstNode.data).toBeInstanceOf(UserTypeDeclaration)
  expect(typeAstNode.dataType).toBe(ValueTypeString.object)

  // Variable check
  let varAstNode = vars.getValue().find(codePiece => codePiece.identifier === varName)!;

  expect(varAstNode.data).toBeInstanceOf(AraLink)
  expect(varAstNode.dataType).toBeInstanceOf(AraLink)
  expect(ReflectLink.isTsNodeLink(varAstNode.data)).toBe(true)

  // Variable's data lint
  const context = new CodePieceContext([], moduleMemory.rest.getAll!(MODULE_SELECTOR).map(node => node.getElement()!), projectMemory);
  const identifiedProfile = await ValueLevel.identifyAstNodeData(varAstNode, context);
  expect(identifiedProfile.isSuccess).toBe(true);
  varAstNode.typedData = identifiedProfile.getValue();
  context.post([varAstNode])
});

// export type CustomType = {name: string, sex: number}
// const obj: CustomType[] = [{name: 'Medet', sex:0, surname: 'Ahmetson'}, {name: 'Brynn', sex: 1}];
test('Supports the arrays through Array literals', async () => {
  const reflect = new Reflect({packageLink: reflectingPkgUrl});
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
  types.getValue().forEach((importedCodePiece) => {
      const posted = moduleMemory.rest.post!('*', importedCodePiece, {});
      expect(posted.isSuccess).toBe(true);
  });
  
  let identified = await code.getLintedTypeIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // Add built in types and lint them
  (await BuiltInIdentifiers.getBuiltInIdentifiers()).getValue().forEach((importedCodePiece) => {
    const posted = moduleMemory.rest.post!('*', importedCodePiece, {});
    expect(posted.isSuccess).toBe(true);   
  })

  // Type checks
  let typeAstNode = types.getValue().find(codePiece => codePiece.identifier === typeName)!;

  expect(typeAstNode.data).toBeInstanceOf(UserTypeDeclaration)
  expect(typeAstNode.dataType).toBe(ValueTypeString.object)

  // Variable check
  let varAstNode = vars.getValue().find(codePiece => codePiece.identifier === varName)!;
  expect(varAstNode.data).toBeInstanceOf(AraLink)
  expect(Array.isArray(varAstNode.dataType)).toBe(true)
  expect((varAstNode.dataType as Array<any>)[0]).toBeInstanceOf(AraLink)
  expect(ReflectLink.isTsNodeLink(varAstNode.data)).toBe(true)

  // Variable's data lint
  const context = new CodePieceContext([], moduleMemory.rest.getAll!(MODULE_SELECTOR).map(node => node.getElement()!), projectMemory);
  const identifiedProfile = await ValueLevel.identifyAstNodeData(varAstNode, context);
  expect(identifiedProfile.isSuccess).toBe(true);
  varAstNode.typedData = identifiedProfile.getValue();
  context.post([varAstNode])
});

// const names: string[] = ['Medet', 'Brynn'];
test('Supports the arrays with primitive types', async () => {
  const reflect = new Reflect({packageLink: reflectingPkgUrl});
  const projectMemory = getProjectMemory(reflect.nodeJsExt);
  const moduleMemory = getEmptyModule();

  const typeName = 'string'
  const varName = 'names'

  let src = ` const ${varName}: ${typeName}[] = ['Medet', 'Brynn']`;

  let code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  let vars = await code.getVariableIdentifiers();

  // Add built in types and lint them
  (await BuiltInIdentifiers.getBuiltInIdentifiers()).getValue().forEach((importedCodePiece) => {
    const posted = moduleMemory.rest.post!('*', importedCodePiece, {});
    expect(posted.isSuccess).toBe(true);   
  })

  // Variable check
  let varAstNode = vars.getValue().find(codePiece => codePiece.identifier === varName)!;

  expect(varAstNode.data).toBeInstanceOf(AraLink)
  expect(Array.isArray(varAstNode.dataType)).toBe(true)
  expect((varAstNode.dataType as Array<any>)[0]).toBe(ValueTypeString.string)
  expect(ReflectLink.isTsNodeLink(varAstNode.data)).toBe(true)

  // Variable's data lint
  const context = new CodePieceContext([], moduleMemory.rest.getAll!(MODULE_SELECTOR).map(node => node.getElement()!), projectMemory);
  const identifiedProfile = await ValueLevel.identifyAstNodeData(varAstNode, context);
  expect(identifiedProfile.isSuccess).toBe(true);
  varAstNode.typedData = identifiedProfile.getValue();
  context.post([varAstNode])
});

// export type CustomType = {name: string, sex: number}
// const name = 'Medet';
// const names: CustomType = {name, sex: 1};
test('Supports the shorthand project assign with primitive types', async () => {
  const reflect = new Reflect({packageLink: reflectingPkgUrl});
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
  types.getValue().forEach((importedCodePiece) => {
      const posted = moduleMemory.rest.post!('*', importedCodePiece);
      expect(posted.isSuccess).toBe(true);
  });
  
    
  let identified = await code.getLintedTypeIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // Type checks
  let typeNode = types.getValue().find(codePiece => codePiece.identifier === typeName)!;
  expect(typeNode.data).toBeInstanceOf(UserTypeDeclaration);
  expect(typeNode.dataType).toBe(ValueTypeString.object);

  // Add built in types and lint them
  (await BuiltInIdentifiers.getBuiltInIdentifiers()).getValue().forEach((importedCodePiece) => {
    const posted = moduleMemory.rest.post!('*', importedCodePiece);
    expect(posted.isSuccess).toBe(true);   
  })
  const foundVar = vars.getValue().find(codePiece => codePiece.identifier === propertyName);
  moduleMemory.rest.post!('*', foundVar!)

  // Variable check
  let varAstNode = vars.getValue().find(codePiece => codePiece.identifier === varName)!;
  expect(varAstNode.data).toBeInstanceOf(AraLink)
  expect(varAstNode.dataType).toBeInstanceOf(AraLink)
  expect(ReflectLink.isTsNodeLink(varAstNode.data)).toBe(true)

  // Variable's data lint
  const context = new CodePieceContext([], moduleMemory.rest.getAll!(MODULE_SELECTOR).map(node => node.getElement()!), projectMemory);
  const identifiedProfile = await ValueLevel.identifyAstNodeData(varAstNode, context);
  expect(identifiedProfile.isSuccess).toBe(true);
  varAstNode.typedData = identifiedProfile.getValue();
  context.post([varAstNode])
});

// export type CustomType = {name: string, sex: number}
// const names: CustomType = ({name: 'Medet', sex: +1});
test('Supports the parenthesis', async () => {
  const reflect = new Reflect({packageLink: reflectingPkgUrl});
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
  types.getValue().forEach((importedCodePiece) => {
      const posted = moduleMemory.rest.post!('*', importedCodePiece);
      expect(posted.isSuccess).toBe(true);
  });
  
    
  let identified = await code.getLintedTypeIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // Type checks
  let typeNode = types.getValue().find(codePiece => codePiece.identifier === typeName)!;
  expect(typeNode.data).toBeInstanceOf(UserTypeDeclaration)
  expect(typeNode.dataType).toBe(ValueTypeString.object);

  // Add built in types and lint them
  (await BuiltInIdentifiers.getBuiltInIdentifiers()).getValue().forEach((importedCodePiece) => {
    const posted = moduleMemory.rest.post!('*', importedCodePiece);
    expect(posted.isSuccess).toBe(true);   
  })
  const foundVar = vars.getValue().find(codePiece => codePiece.identifier === propertyName);
  moduleMemory.rest.post!('*', foundVar!)


  // Variable check
  let varAstNode = vars.getValue().find(codePiece => codePiece.identifier === varName)!;

  expect(varAstNode.data).toBeInstanceOf(AraLink)
  expect(varAstNode.dataType).toBeInstanceOf(AraLink)
  expect(ReflectLink.isTsNodeLink(varAstNode.data)).toBe(true)

  // Variable's data lint
  const context = new CodePieceContext([], moduleMemory.rest.getAll!(MODULE_SELECTOR).map(node => node.getElement()!), projectMemory);
  const identifiedProfile = await ValueLevel.identifyAstNodeData(varAstNode, context);
  expect(identifiedProfile.isSuccess).toBe(true);
  varAstNode.typedData = identifiedProfile.getValue();
  context.post([varAstNode])
});

// export type CustomType = {name: string, sex: number}
// const data = 1
// const names = data === 1 ? ({name: 'Medet', sex: +1}) : 'Not found';
test('Supports the conditional expression', async () => {
  const reflect = new Reflect({packageLink: reflectingPkgUrl});
  const projectMemory = getProjectMemory(reflect.nodeJsExt);
  const moduleMemory = getEmptyModule();

  const typeName = 'CustomType'
  const propertyName = 'name'
  const varName = 'names'
  const trueCondition = '1';

  const src = 
    ` export type ${typeName} = { ${propertyName}: string; sex: number };` +
    ` const data = ${trueCondition}; ` +
    ` const ${varName} = data === 1 ? ({${propertyName}: 'Medet', sex: +1}) : 'Not found'`;
  const code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  const vars = await code.getVariableIdentifiers();

  // Add types and lint them.
  const types = await code.getTypeIdentifiers();
  expect(types.isSuccess).toBe(true);
  types.getValue().forEach((importedCodePiece) => {
      const posted = moduleMemory.rest.post!('*', importedCodePiece);
      expect(posted.isSuccess).toBe(true);
  });
  const identified = await code.getLintedTypeIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // Type checks
  const typeNode = types.getValue().find(codePiece => codePiece.identifier === typeName)!;
  expect(typeNode.data).toBeInstanceOf(UserTypeDeclaration)
  expect(typeNode.dataType).toBe(ValueTypeString.object);

  // Add built in types and lint them
  (await BuiltInIdentifiers.getBuiltInIdentifiers()).getValue().forEach((importedCodePiece) => {
    const posted = moduleMemory.rest.post!('*', importedCodePiece, {});
    expect(posted.isSuccess).toBe(true);   
  })
  const foundVar = vars.getValue().find(codePiece => codePiece.identifier === 'data');
  moduleMemory.rest.post!('*', foundVar!, {})

  // Variable check
  const varAstNode = vars.getValue().find(codePiece => codePiece.identifier === varName)!;
  expect(varAstNode.data).toBeInstanceOf(AraLink)
  expect(varAstNode.dataType).toBeUndefined()
  expect(ReflectLink.isTsNodeLink(varAstNode.data)).toBe(true)

  // Variable's data lint
  const context = new CodePieceContext([], moduleMemory.rest.getAll!(MODULE_SELECTOR).map(node => node.getElement()!), projectMemory);
  const identifiedProfile = await ValueLevel.identifyAstNodeData(varAstNode, context);
  expect(identifiedProfile.isSuccess).toBe(true);
  varAstNode.typedData = identifiedProfile.getValue();
  expect(varAstNode.data).toStrictEqual({ name: 'Medet', sex: 1 })
  expect(varAstNode.dataType).toEqual(ValueTypeString.object)
  context.post([varAstNode])
});

test('Supports the conditional expression when its false', async () => {
  const reflect = new Reflect({packageLink: reflectingPkgUrl});
  const projectMemory = getProjectMemory(reflect.nodeJsExt);
  const moduleMemory = getEmptyModule();

  const typeName = 'CustomType'
  const propertyName = 'name'
  const varName = 'names'

  const falseCondition = '-2';
  //
  // False check
  //
  const src = 
  ` export type ${typeName} = { ${propertyName}: string; sex: number };` +
  ` const data = ${falseCondition}; ` +
  ` const ${varName} = data === 1 ? ({${propertyName}: 'Medet', sex: +1}) : 'Not found'`;
  const code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  const vars = await code.getVariableIdentifiers();

  // Add types and lint them.
  const types = await code.getTypeIdentifiers();
  expect(types.isSuccess).toBe(true);
  types.getValue().forEach((importedCodePiece) => {
      const posted = moduleMemory.rest.post!('*', importedCodePiece, {});
      expect(posted.isSuccess).toBe(true);
  });
  
  const identified = await code.getLintedTypeIdentifiers(moduleMemory, projectMemory)
  expect(identified.isSuccess).toBe(true);

  // Type checks
  const typeNode = types.getValue().find(codePiece => codePiece.identifier === typeName)!;

  expect(typeNode.data).toBeInstanceOf(UserTypeDeclaration)
  expect(typeNode.dataType).toBe(ValueTypeString.object);

  // Add built in types and lint them
  (await BuiltInIdentifiers.getBuiltInIdentifiers()).getValue().forEach((importedCodePiece) => {
    const posted = moduleMemory.rest.post!('*', importedCodePiece, {});
    expect(posted.isSuccess).toBe(true);   
  })
  const foundVar2 = vars.getValue().find(codePiece => codePiece.identifier === 'data');
  const var2Posted = moduleMemory.rest.post!('*', foundVar2!, {})
  expect(var2Posted.isSuccess).toBe(true);
  // Variable check
  const varAstNode = vars.getValue().find(codePiece => codePiece.identifier === varName)!;
  expect(varAstNode.data).toBeInstanceOf(AraLink)
  expect(varAstNode.dataType).toBeUndefined()
  expect(ReflectLink.isTsNodeLink(varAstNode.data)).toBe(true)

  // Variable's data lint
  const context = new CodePieceContext([], moduleMemory.rest.getAll!(MODULE_SELECTOR).map(node => node.getElement()!), projectMemory);
  const identifiedProfile = await ValueLevel.identifyAstNodeData(varAstNode, context);
  expect(identifiedProfile.isSuccess).toBe(true);
  varAstNode.typedData = identifiedProfile.getValue();
  expect(varAstNode.data).toStrictEqual('Not found')
  expect(varAstNode.dataType).toEqual(ValueTypeString.string)
  context.post([varAstNode])
});       
