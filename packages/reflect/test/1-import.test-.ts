/**
 * Testing the Reflect itself
 */
import { FilePath } from "../src/module.js";
import { Reflect } from "../src/reflect.js"
import { expect, test } from "vitest";
import { getEmptyModule, getProjectMemory, putFuncModule } from "./shared.js";
import { Code } from "../src/code-level/code.js";
import { Debug } from "@ara-web/p-hintjens";

class TestCode extends Code {
}

const sourceCode = 
    `import fooBar from "./funcs.ts"` 
    + `import { fooBar as fooBarFunc, type CustomType as FooBarCustomType } from "./funcs.ts"` 
    + `fooBar("medet", "ahmetson")` 
    + `import CustomType from "./custom-type.ts"`
;

const genericTypeCode = `import type { CustomType } from "./funcs.ts"`;
const moduleLink = FilePath.getFileAbsolutePath("./code-level.test.ts", import.meta.filename);
const reflect = new Reflect({packageLink: moduleLink});
const projectMemory = getProjectMemory(reflect.nodeJsExt);

test('Import with "as" keyword', async () => {
    await putFuncModule(reflect.nodeJsExt, reflect.rest!());
    await putFuncModule(reflect.nodeJsExt, reflect.rest!(), "./custom-type.ts");
    const testModule = getEmptyModule(moduleLink.toFilePath);
    const testCode = new TestCode(sourceCode, moduleLink);
    const data = await testCode.getImportedIdentifiers(projectMemory);
    Debug.log(`testCode.getImportedIdentifiers:`, data);
    expect(data.isSuccess).toBe(true);
    for (const importedCodePiece of data.getValue()) {
      await testModule.rest.post!('*', importedCodePiece, {})
    }

    const identifiers = await testCode.getLintedImportIdentifiers(testModule, projectMemory)
    expect(identifiers.isSuccess).toBe(true)
});

test('Import with type as first node', async () => {
    await putFuncModule(reflect.nodeJsExt, reflect.rest!());
    await putFuncModule(reflect.nodeJsExt, reflect.rest!(), "./custom-type.ts");
    const testModule = getEmptyModule(moduleLink.toFilePath);
    const testCode = new TestCode(genericTypeCode, moduleLink);
    const data = await testCode.getImportedIdentifiers(projectMemory);
    expect(data.isSuccess).toBe(true);
    for (const importedCodePiece of data.getValue()) {
      testModule.rest.post!('*', importedCodePiece, {})
    }
    
    const identifiers = await testCode.getLintedImportIdentifiers(testModule, projectMemory)
    expect(identifiers.isSuccess).toBe(true)
});

