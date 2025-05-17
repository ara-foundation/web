import { expect, test } from "vitest";
import { Code } from "../src/code-level/code.js";
import { CodePiece } from "../src/code-level/code-piece.js";
import { IntersectedUnionType, UserTypeDeclaration, UnionTypeDeclaration, ValueTypeString } from "../src/code-level/code-piece-types.js";
import { ModuleMemory } from "../src/module-memory.js";
import { ProjectMemory } from "../src/project-memory.js";
import { AraLink, ModuleLink, ObjectNode } from "@ara-web/sds";
import { ReflectLink } from "../src/code-level/reflect-link.js";
import { BuiltInIdentifiers, codePieceOps, MODULE_SELECTOR } from "../src/index.js";
import { TypeValueTraits } from "../src/code-level/type-level/type-value-traits.js";
import { expectAstNodeResult, expectValidTypeNode } from "./shared.js";
import { Debug } from "@ara-web/p-hintjens";

const moduleLink = ModuleLink.newFileURL(import.meta.filename);

test('Supports the union types: type Primary = string | number | boolean', async () => {
  const varName = 'Primary'  
  const src = `type ${varName} = string | number | boolean`;
  const code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  const types = await code.getTypeIdentifiers();

    // Result
    expectAstNodeResult(types, varName)
    const astNode = types.getValue().find(codePiece => codePiece.identifier === varName)!;
    expectValidTypeNode(astNode, varName, UnionTypeDeclaration);

    // Node Data
    const data = astNode.data as UnionTypeDeclaration;
    expect(data.unionLength).toEqual(3)
    expect(data.getUnion(0)).toEqual(ValueTypeString.string)
    expect(data.getUnion(1)).toEqual(ValueTypeString.number)
    expect(data.getUnion(2)).toEqual(ValueTypeString.boolean)

    // Linting
    const projectMemory = new ProjectMemory()
    const moduleMemory = new ModuleMemory<undefined>("page", moduleLink, {});
    const parent = moduleMemory.rest.get!('*')!
    types.getValue().forEach((importedCodePiece) => {
      const posting = new ObjectNode<CodePiece>(codePieceOps, importedCodePiece, parent);
      const posted = moduleMemory.rest.post!('*', posting);
      expect(posted.isSuccess).toBe(true);
    });
    const linted = await code.getLintedTypeIdentifiers<undefined>(moduleMemory, projectMemory)

    // Linting Result
    expectAstNodeResult(linted, varName)
    const lintedNode = linted.getValue().find(codePiece => codePiece.identifier === varName)!;
    expectValidTypeNode(lintedNode, varName, UnionTypeDeclaration, 'object');

    // Linted Node Data
    const lintedData = astNode.data as UnionTypeDeclaration;
    expect(lintedData.unionLength).toEqual(3)
    expect(lintedData.getUnion(0)).toEqual(ValueTypeString.string)
    expect(lintedData.getUnion(1)).toEqual(ValueTypeString.number)
    expect(lintedData.getUnion(2)).toEqual(ValueTypeString.boolean)
});

test('Supports the union types with nested union: type Type2 = string | "keyword" | (number|keyword)()', async () => {
  const varName = `Type2`
  const src = `type ${varName} = number | "keyword" | (number|"keyword")[]`;
  const code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  const types = await code.getTypeIdentifiers();

  // Result
  expectAstNodeResult(types, varName)
  const astNode = types.getValue().find(codePiece => codePiece.identifier === varName)!;
  expect(astNode.identifier).toEqual(varName)
  expectValidTypeNode(astNode, varName, UnionTypeDeclaration);

  // Node Data
  const data = astNode.data as UnionTypeDeclaration;
  expect(data.unionLength).toEqual(3)
  expect(data.getUnion(0)).toEqual(ValueTypeString.number)
  expect(data.getUnion(1)).toEqual("keyword")
  expect(data.getUnion(2)).toBeInstanceOf(Array<UnionTypeDeclaration>)
  const arrayElement = (data.getUnion(2) as Array<UnionTypeDeclaration>)[0];
  expect(arrayElement.unionLength).toEqual(2)
  expect(arrayElement.getUnion(0)).toEqual(ValueTypeString.number)
  expect(arrayElement.getUnion(1)).toEqual("keyword")


  // Linting
  const projectMemory = new ProjectMemory()
  const moduleMemory = new ModuleMemory<undefined>("page", moduleLink, {});
  const parent = moduleMemory.rest.get!('*')!
  types.getValue().forEach((importedCodePiece) => {
    const posting = new ObjectNode<CodePiece>(codePieceOps, importedCodePiece, parent);
    const posted = moduleMemory.rest.post!('*', posting)
    expect(posted.isSuccess).toBe(true);
  });  
  const linted = await code.getLintedTypeIdentifiers<undefined>(moduleMemory, projectMemory)

  // Linting Result
  expectAstNodeResult(linted, varName)
  const lintedNode = linted.getValue().find(codePiece => codePiece.identifier === varName)!;
  expectValidTypeNode(lintedNode, varName, UnionTypeDeclaration, 'object');

  // Linted Node Data
  const lintedData = lintedNode.data as UnionTypeDeclaration;
  expect(lintedData.unionLength).toEqual(3)
  expect(lintedData.getUnion(0)).toEqual(ValueTypeString.number)
  expect(lintedData.getUnion(1)).toEqual("keyword")
  expect(lintedData.getUnion(2)).toBeInstanceOf(Array<UnionTypeDeclaration>)
  const lintedElement = (lintedData.getUnion(2) as Array<UnionTypeDeclaration>)[0];
  expect(lintedElement.unionLength).toEqual(2)
  expect(lintedElement.getUnion(0)).toEqual(ValueTypeString.number)
  expect(lintedElement.getUnion(1)).toEqual("keyword")
});

test('Support the custom data as part of union such as false, number, float', async () => {
  const varName = `LiteralType`
  const src = `type ${varName} = number | 30 | 1995.05 | boolean | false | true | string | "string literal text"`;
  const code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  const types = await code.getTypeIdentifiers();

  // Result
  expectAstNodeResult(types, varName)
  const astNode = types.getValue().find(codePiece => codePiece.identifier === varName)!;
  expectValidTypeNode(astNode, varName, UnionTypeDeclaration);

  // Node Data
  const data = astNode.data as UnionTypeDeclaration;
  expect(data.unionLength).toEqual(8)
  expect(data.getUnion(0)).toEqual(ValueTypeString.number)
  expect(data.getUnion(1)).toEqual(30)
  expect(data.getUnion(2)).toEqual(1995.05)
  expect(data.getUnion(3)).toEqual(ValueTypeString.boolean)
  expect(data.getUnion(4)).toEqual(false)
  expect(data.getUnion(5)).toEqual(true)
  expect(data.getUnion(6)).toEqual(ValueTypeString.string)
  expect(data.getUnion(7)).toEqual("string literal text")

  // Linting
  const projectMemory = new ProjectMemory()
  const moduleMemory = new ModuleMemory<undefined>("page", moduleLink, {});
  const parent = moduleMemory.rest.get!('*')!
  types.getValue().forEach((importedCodePiece) => {
    const posting = new ObjectNode<CodePiece>(codePieceOps, importedCodePiece, parent);
    moduleMemory.rest.post!('*', posting)
  });
  const linted = await code.getLintedTypeIdentifiers<undefined>(moduleMemory, projectMemory)

  // Linting Result
  expectAstNodeResult(linted, varName)
  const lintedNode = linted.getValue().find(codePiece => codePiece.identifier === varName)!;
  expectValidTypeNode(lintedNode, varName, UnionTypeDeclaration, 'object');

  // Linted Node Data
  const lintedData = lintedNode.data as UnionTypeDeclaration;
  expect(lintedData.unionLength).toEqual(8)
  expect(lintedData.getUnion(0)).toEqual(ValueTypeString.number)
  expect(lintedData.getUnion(1)).toEqual(30)
  expect(lintedData.getUnion(2)).toEqual(1995.05)
  expect(lintedData.getUnion(3)).toEqual(ValueTypeString.boolean)
  expect(lintedData.getUnion(4)).toEqual(false)
  expect(lintedData.getUnion(5)).toEqual(true)
  expect(lintedData.getUnion(6)).toEqual(ValueTypeString.string)
  expect(lintedData.getUnion(7)).toEqual("string literal text")
});

test('Support the literals in the union types', async () => {
  const varName = `TypeUnionWithTypeLiteral`
  const src = `type ${varName} = number | 30 | 1995.05 | {name: string}`;
  const code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  const types = await code.getTypeIdentifiers();

  // Result
  expectAstNodeResult(types, varName)
  const astNode = types.getValue().find(codePiece => codePiece.identifier === varName)!
  expectValidTypeNode(astNode, varName, UnionTypeDeclaration);

  // Node Data
  const data = astNode.data as UnionTypeDeclaration;
  expect(data.unionLength).toEqual(4)
  expect(data.getUnion(0)).toEqual(ValueTypeString.number)
  expect(data.getUnion(1)).toEqual(30)
  expect(data.getUnion(2)).toEqual(1995.05)
  expect(data.getUnion(3)).instanceOf(UserTypeDeclaration)
  const records = data.getUnion(3) as UserTypeDeclaration;
  expect(records.length).toEqual(1);
  expect(records.get("name")).toEqual(ValueTypeString.string);

  // Linting
  const projectMemory = new ProjectMemory()
  const moduleMemory = new ModuleMemory<undefined>("page", moduleLink, {});
  const parent = moduleMemory.rest.get!('*')!
  types.getValue().forEach((importedCodePiece) => {
    const posting = new ObjectNode<CodePiece>(codePieceOps, importedCodePiece, parent);
    moduleMemory.rest.post!('*', posting)
  });
  
  const linted = await code.getLintedTypeIdentifiers<undefined>(moduleMemory, projectMemory)

  // Linting Result
  expectAstNodeResult(linted, varName)
  const lintedNode = linted.getValue().find(codePiece => codePiece.identifier === varName)!
  expectValidTypeNode(lintedNode, varName, UnionTypeDeclaration, 'object');

  // Linted Node Data
  const lintedData = lintedNode.data as UnionTypeDeclaration;
  expect(lintedData.unionLength).toEqual(4)
  expect(lintedData.getUnion(0)).toEqual(ValueTypeString.number)
  expect(lintedData.getUnion(1)).toEqual(30)
  expect(lintedData.getUnion(2)).toEqual(1995.05)
  expect(lintedData.getUnion(3)).instanceOf(UserTypeDeclaration)
  const lintedRecords = lintedData.getUnion(3) as UserTypeDeclaration;
  expect(lintedRecords.length).toEqual(1);
  expect(lintedRecords.get("name")).toEqual(ValueTypeString.string);
});

// test('Support the literals with union types', async () => {
//   const varName = `TypeLiteralWithTypeUnion`
//   const src = `type ${varName} = {name: string, sex: "male" | "female"}`;
//   const code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
//   const types = await code.getTypeIdentifiers();

//   // Result
//   expectAstNodeResult(types, varName)
//   const astNode = types.getValue().find(codePiece => codePiece.identifier === varName)!;

//   expectValidTypeNode(astNode, varName, UserTypeDeclaration);

//   // Node Data
//   const data = astNode.data as UserTypeDeclaration;
//   expect(data.length).toEqual(2)
//   expect(data.get('name')).toEqual(ValueTypeString.string)
//   expect(data.get('sex')).toBeInstanceOf(UnionTypeDeclaration)
//   const records = data.get('sex') as UnionTypeDeclaration;
//   expect(records.unionLength).toEqual(2);
//   expect(records.getUnion(0)).toEqual("male");
//   expect(records.getUnion(1)).toEqual("female");

//   // Linting
//   const projectMemory = new ProjectMemory()
//   const moduleMemory = new ModuleMemory<undefined>("page", moduleLink, {});
//   const parent = moduleMemory.rest.get!('*')!
//   types.getValue().forEach((importedCodePiece) => {
//     const posting = new ObjectNode<CodePiece>(codePieceOps, importedCodePiece, parent);
//     moduleMemory.rest.post!('*', posting)
//   });
//   const linted = await code.getLintedTypeIdentifiers<undefined>(moduleMemory, projectMemory)

//   // Linting Result
//   expectAstNodeResult(linted, varName)
//   const lintedNode = linted.getValue().find(codePiece => codePiece.identifier === varName)!;

//   expectValidTypeNode(lintedNode, varName, UserTypeDeclaration, 'object');

//   // Linted Node Data
//   const lintedData = lintedNode.data as UserTypeDeclaration;
//   expect(lintedData.length).toEqual(2)
//   expect(lintedData.get('name')).toEqual(ValueTypeString.string)
//   expect(lintedData.get('sex')).toBeInstanceOf(UnionTypeDeclaration)
//   const lintedRecords = lintedData.get('sex') as UnionTypeDeclaration;
//   expect(lintedRecords.unionLength).toEqual(2);
//   expect(lintedRecords.getUnion(0)).toEqual("male");
//   expect(lintedRecords.getUnion(1)).toEqual("female");
// });

// // Assert Support the Type as non literal nor union, expression
// // type ExpressionType = string
// test('Support the expression as a type alias', async () => {
//   const varName = `ExpressionType`
//   const src = `type ${varName} = string`;
//   const code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
//   const types = await code.getTypeIdentifiers();

//   // Result
//   expectAstNodeResult(types, varName)
//   const astNode = types.getValue().find(codePiece => codePiece.identifier === varName)!;

//   expectValidTypeNode(astNode, varName, ValueTypeString.string);

//   // Linting
//   const projectMemory = new ProjectMemory()
//   const moduleMemory = new ModuleMemory<undefined>("page", moduleLink, {});
//   const parent = moduleMemory.rest.get!('*')!
//   types.getValue().forEach((importedCodePiece) => {
//     const posting = new ObjectNode<CodePiece>(codePieceOps, importedCodePiece, parent);
//     moduleMemory.rest.post!('*', posting)
//   });
//   const linted = await code.getLintedTypeIdentifiers<undefined>(moduleMemory, projectMemory)

//   // Linting Result
//   expectAstNodeResult(linted, varName)
//   const lintedNode = linted.getValue().find(codePiece => codePiece.identifier === varName)!;

//   expectValidTypeNode(lintedNode, varName, ValueTypeString.string, 'string');
// });

// test('Support the generic types', async () => {
//   const varName = `Generic`
//   const genericName = 'T'
//   const src = `type ${varName}<${genericName}> = ${genericName}`;
//   const code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
//   const types = await code.getTypeIdentifiers();

//   // Result
//   expectAstNodeResult(types, varName)
//   const astNode = types.getValue().find(codePiece => codePiece.identifier === varName)!;

//   expectValidTypeNode(astNode, varName, AraLink);

//   // The Data
//   expect(ReflectLink.isIdentifierLink(astNode.data as AraLink<string>)).toBe(true)
//   expect((astNode.data as AraLink<string>).resource).toEqual(genericName)

//   // The generic data
//   expect(astNode.memoryDataLength()).toEqual(1)
//   expectValidTypeNode(astNode.getMemoryData(0)!, genericName, undefined, ValueTypeString.object)

//   // // Linting
//   const projectMemory = new ProjectMemory()
//   const moduleMemory = new ModuleMemory<undefined>("page", moduleLink, {});
//   const parent = moduleMemory.rest.get!('*')!
//   types.getValue().forEach((importedCodePiece) => {
//     const posting = new ObjectNode<CodePiece>(codePieceOps, importedCodePiece, parent);
//     moduleMemory.rest.post!('*', posting)
//   });
//   const linted = await code.getLintedTypeIdentifiers<undefined>(moduleMemory, projectMemory)

//   // // Linting Result
//   expectAstNodeResult(linted, varName)
//   const lintedNode = linted.getValue().find(codePiece => codePiece.identifier === varName)!;

//   expectValidTypeNode(lintedNode, varName, undefined, ValueTypeString.object)
// });

// // type GenericUnion<T extends number> = T | string
// test('Support the generic union types', async () => {
//   const varName = `GenericUnion`
//   const genericName = 'T'
//   const src = `type ${varName}<${genericName}> = ${genericName} | string`;
//   const code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
//   const types = await code.getTypeIdentifiers();

//   // Result
//   expectAstNodeResult(types, varName)
//   const astNode = types.getValue().find(codePiece => codePiece.identifier === varName)!;

//   expectValidTypeNode(astNode, varName, UnionTypeDeclaration);

//   // The Data
//   const unionType = astNode.data as UnionTypeDeclaration;
//   expect(unionType.unionLength).toBe(2);
//   expect(unionType.getUnion(0)).toBeInstanceOf(AraLink)
//   expect((unionType.getUnion(0) as AraLink<string>).resource).toEqual(genericName)
//   expect(unionType.getUnion(1)).toEqual(ValueTypeString.string)

//   // The generic data
//   expect(astNode.memoryDataLength()).toEqual(1)
//   expectValidTypeNode(astNode.getMemoryData(0)!, genericName, undefined, ValueTypeString.object)

//   // Linting
//   const projectMemory = new ProjectMemory()
//   const moduleMemory = new ModuleMemory<undefined>("page", moduleLink, {});
//   const parent = moduleMemory.rest.get!('*')!
//   types.getValue().forEach((importedCodePiece) => {
//     const posting = new ObjectNode<CodePiece>(codePieceOps, importedCodePiece, parent);
//     moduleMemory.rest.post!('*', posting)
//   });
//   const linted = await code.getLintedTypeIdentifiers<undefined>(moduleMemory, projectMemory)

//   // Linting Result
//   expectAstNodeResult(linted, varName)
//   const lintedNode = linted.getValue().find(codePiece => codePiece.identifier === varName)!;

//   expectValidTypeNode(lintedNode, varName, UnionTypeDeclaration, ValueTypeString.object)

//   const lintedUnionType = lintedNode.data as UnionTypeDeclaration;
//   expect(lintedUnionType.unionLength).toBe(2);
//   expect(lintedUnionType.getUnion(0)).toStrictEqual({})
//   expect(lintedUnionType.getUnion(1)).toEqual(ValueTypeString.string)
// });

// Assert: Support the generic union in the nested union
// type GenericToNestedUnion<RecordValue extends Array<number>> = number | Record<string, RecordValue>;
test('Support the generic types with the nested generic types and union types', async () => {
  const varName = `GenericToNestedUnion`
  const genericName = `RecordValue`
  const recordName = `Record`
  const arrayName = `Array`
  const src = `type ${varName}<${genericName} extends Array<number>> = number | Record<string, ${genericName}>`;
  const code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  const types = await code.getTypeIdentifiers();

  // Result
  expectAstNodeResult(types, varName)
  const astNode = types.getValue().find(codePiece => codePiece.identifier === varName)!;
  
  expectValidTypeNode(astNode, varName, UnionTypeDeclaration);

  // The Data
  const unionType = astNode.data as UnionTypeDeclaration;
  expect(unionType.unionLength).toBe(2);
  expect(unionType.getUnion(0)).toEqual(ValueTypeString.number)
  expect(unionType.getUnion(1)).toBeInstanceOf(AraLink)
  expect((unionType.getUnion(1) as AraLink<string>).resource).toEqual(recordName)

  // The generic data
  expect(astNode.memoryDataLength()).toEqual(1)
  expectValidTypeNode(astNode.getMemoryData(0)!, genericName, AraLink, ValueTypeString.object)
  expect((astNode.getMemoryData(0)!.data! as AraLink<string>).resource).toEqual(arrayName)

  // Linting
  const projectMemory = new ProjectMemory()
  const moduleMemory = new ModuleMemory<undefined>("page", moduleLink, {});
  const builtInIdentifiers = await BuiltInIdentifiers.getBuiltInIdentifiers();
  expect(builtInIdentifiers.isSuccess).toBe(true);
  const parent = moduleMemory.rest.get!('*')!
  builtInIdentifiers.getValue().forEach((importedCodePiece) => {
    const posting = new ObjectNode<CodePiece>(codePieceOps, importedCodePiece, parent);
    moduleMemory.rest.post!('*', posting)
  });
  types.getValue().forEach((importedCodePiece) => {
    const posting = new ObjectNode<CodePiece>(codePieceOps, importedCodePiece, parent);
    moduleMemory.rest.post!('*', posting)
  });

  const linted = await code.getLintedTypeIdentifiers<undefined>(moduleMemory, projectMemory)
  // Linting Result
  expectAstNodeResult(linted, varName)
  const lintedNode = linted.getValue().find(codePiece => codePiece.identifier === varName)!;

  expectValidTypeNode(lintedNode, varName, UnionTypeDeclaration, ValueTypeString.object)
  const lintedUnionType = lintedNode.data as UnionTypeDeclaration;
  expect(lintedUnionType.unionLength).toBe(2);
  expect(lintedUnionType.getUnion(0)).toEqual(ValueTypeString.number)
  expect(lintedUnionType.getUnion(1)).toStrictEqual({key: 'string', value: ['number']}) // Record with Number[] as a value
});

// Assert: Conjunction with promitive type is not supported
// type IntersectionWithPrimitive = string[] & number & {name: string} // Should fail
test('Support the generic types with the nested generic types and union types', async () => {
  const varName = `IntersectionWithPrimitive`
  const src = `type ${varName} = string[] & number & {name: string}`;
  const code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  const types = await code.getTypeIdentifiers();

  // Result
  expect(types.isFailure).toBe(true);
  expect(types.errorTitle?.indexOf(TypeValueTraits.ERR_INVALID_INTERSECTION)).toBeGreaterThan(-1)
});

// Assert: Support the Conjunction types
// type Intersection = {numValue: number} & {name: string}
test('Support the intersect types', async () => {
  const varName = `Intersection`
  const src = `type ${varName} = {numValue: number} & {name: string}`;
  const code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  const types = await code.getTypeIdentifiers();

  // Result
  expectAstNodeResult(types, varName)
  const astNode = types.getValue().find(codePiece => codePiece.identifier === varName)!;

  expectValidTypeNode(astNode, varName, IntersectedUnionType);

  const intersected = (astNode.data as IntersectedUnionType);
  expect(intersected.length).toEqual(2);
  expect(intersected.get("name")).toEqual(ValueTypeString.string);
  expect(intersected.get("numValue")).toEqual(ValueTypeString.number);
});

// Assert: Support union and intersection together
test('Support the intersect types with union type', async () => {
  const varName = `UnionIntersection`
  const src = `type ${varName} = {name: string} & {girly: boolean} | {masculine: number}`;
  const code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  const types = await code.getTypeIdentifiers();

  // Result
  expectAstNodeResult(types, varName)
  const astNode = types.getValue().find(codePiece => codePiece.identifier === varName)!;
  expectValidTypeNode(astNode, varName, UnionTypeDeclaration);

  const union = (astNode.data as UnionTypeDeclaration);
  expect(union.unionLength).toEqual(2);
  expect(union.getUnion(0)).toBeInstanceOf(IntersectedUnionType)
  expect(union.getUnion(1)).toBeInstanceOf(UserTypeDeclaration)
  const intersected = union.getUnion(0) as IntersectedUnionType;
  expect(intersected.length).toEqual(2)
  expect(intersected.get("name")).toEqual(ValueTypeString.string)
  expect(intersected.get("girly")).toEqual(ValueTypeString.boolean)
  const typeDeclaration = union.getUnion(1) as UserTypeDeclaration;
  expect(typeDeclaration.length).toEqual(1)
  expect(typeDeclaration.get("masculine")).toEqual(ValueTypeString.number)
});

// Assert: parenthesized union
// type ParenthesizedUnionIntersection = {name: string} & ({girly: boolean} | {masculine: number})
test('Support the intersect types with union type', async () => {
  const varName = `ParenthesizedUnionIntersection`
  const src = `type ${varName} = {name: string} & ({girly: boolean} | {masculine: number})`;
  const code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  const types = await code.getTypeIdentifiers();

  // Result
  expectAstNodeResult(types, varName)
  const astNode = types.getValue().find(codePiece => codePiece.identifier === varName)!;
  expectValidTypeNode(astNode, varName, IntersectedUnionType);

  // Intersection
  const intersected = (astNode.data as IntersectedUnionType);
  expect(intersected.length).toEqual(1);
  expect(intersected.get("name")).toEqual(ValueTypeString.string)

  // Intersection -> Union
  expect(intersected.unionLength).toEqual(2);
  expect(intersected.getUnion(0)).toBeInstanceOf(UserTypeDeclaration)
  expect(intersected.getUnion(1)).toBeInstanceOf(UserTypeDeclaration)
  expect((intersected.getUnion(0) as UserTypeDeclaration).get("girly")).toEqual(ValueTypeString.boolean)
  expect((intersected.getUnion(1) as UserTypeDeclaration).get("masculine")).toEqual(ValueTypeString.number)
});

// Assert the type that has another type in the reference defined later than this type
// type ComplexType = Profile & {profession: string}
// type Profile = {name: string, age: number}
test('Support the type that has another type in the reference defined later than this type', async () => {
  const varName = `ComplexType`
  const simpleVarName = 'Profile';
  const src = 
    `type ${varName} = ${simpleVarName} & {profession: string}; ` + 
    `type ${simpleVarName} = {name: string, age: number}`;
  const code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
  const types = await code.getTypeIdentifiers();

  // Result
  expectAstNodeResult(types, [varName, simpleVarName])
  
  // First, make sure that $simpleVarName exist
  const simpleAstNode = types.getValue().find(codePiece => codePiece.identifier === simpleVarName)!;
  expectValidTypeNode(simpleAstNode, simpleVarName, UserTypeDeclaration);
  const simpleData = simpleAstNode.data as UserTypeDeclaration;
  expect(simpleData.length).toEqual(2)
  expect(simpleData.get("name")).toEqual(ValueTypeString.string)
  expect(simpleData.get("age")).toEqual(ValueTypeString.number)

  // Second, the complex type must have a reference to the simple type
 const astNode = types.getValue().find(codePiece => codePiece.identifier === varName)!;
  expectValidTypeNode(astNode, varName, IntersectedUnionType);

  // Intersection
  const intersected = (astNode.data as IntersectedUnionType);
  expect(intersected.length).toEqual(1);
  expect(intersected.get("profession")).toEqual(ValueTypeString.string)
  expect(intersected.araLinks).toHaveLength(1)

  expect(ReflectLink.isIdentifierLink(intersected.araLinks[0])).toBe(true)
  expect((intersected.araLinks[0]).resource).toEqual(simpleVarName)

  // Lint
  const projectMemory = new ProjectMemory()
  const moduleMemory = new ModuleMemory<undefined>("page", moduleLink, {});
    const parent = moduleMemory.rest.get!('*')!

  types.getValue().forEach((importedCodePiece) => {
    const posting = new ObjectNode<CodePiece>(codePieceOps, importedCodePiece, parent);
    moduleMemory.rest.post!('*', posting)
  });

  const linted = await code.getLintedTypeIdentifiers<undefined>(moduleMemory, projectMemory)

  // Linting Result
  expectAstNodeResult(linted, [varName, simpleVarName])
  const lintedNode = linted.getValue().find(codePiece => codePiece.identifier === varName)!;

  expectValidTypeNode(lintedNode, varName, IntersectedUnionType, ValueTypeString.object)

  const lintedData = lintedNode.data as IntersectedUnionType;
  expect(lintedData.length).toBe(3);
  expect(lintedData.get("profession")).toEqual(ValueTypeString.string)
  expect(lintedData.get("name")).toEqual(ValueTypeString.string)
  expect(lintedData.get("age")).toEqual(ValueTypeString.number)
});
