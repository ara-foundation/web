import { expect, test } from "vitest";
import { DOCUMENT_SELECTOR, ModuleLink, Rest } from "@ara-web/sds";
import { MEMOP_TAG, MODULE_MEMORY_TAG, ModuleMemory, ProjectMemory, Reflect, reflectElementToObjectTree, ReflectElementType } from "../src/index";
import { getImportRecords as getSampleModuleData } from "./shared.js";
import { CodePiece } from "../src/code-level/index.js";
import { RestReflectHookProxy } from "../src/rest-reflect-hook-proxy.js";
import { escapeId } from "../src/reflect-object-tree.js";

const elementType = (element: ReflectElementType): string => {
    if (element instanceof CodePiece) {
        return `Code Piece('${element.nodeType}#${element.identifier}')`
    } else if (element instanceof ModuleMemory) {
        return `Module Memory('${element.moduleLink.moduleURL}')`
    } else if (element instanceof ProjectMemory) {
        return `Project Memory('${element.memoryOperatorId}')`
    } else if ("memoryOperatorId" in element) {
        return `Extension('${element.memoryOperatorId}')`
    }
    return 'unknown'
}


test(`Object Tree building from module operators and modules work`, async() => {
    // Project Memory is the root node of our reflect
    const projectMemory = new ProjectMemory();
    // The child nodes of project memory.
    // It should be:
    // #document -> memop#pkg
    // #document -> memop#pkg
    const builtInExt1 = new Reflect({packageLink: ModuleLink.newPackageURL('', 'reflect')}).nodeJsExt
    const builtInExt2 = new Reflect({packageLink: ModuleLink.newPackageURL('', 'reflect2')}).nodeJsExt
    
    // Child nodes of extension: module memories
    // It should be:
    // #document -> memop -> module-memory
    const categorizedModules = getSampleModuleData();
    // After adding the records
    const modulesPutted = await builtInExt2.putModules(categorizedModules);
    expect(modulesPutted.isSuccess).toBe(true);

    //
    // The Rest operations
    //

    // Root node works?
    const rest = new Rest(projectMemory!, reflectElementToObjectTree);
    const elems1 = rest.getAll!('*');
    expect(elems1).toHaveLength(1);
    expect(elems1[0].selector === DOCUMENT_SELECTOR);

    // Add memop to root node
    const postedExt = rest.post!('*', builtInExt1, {});
    expect(postedExt.isSuccess).toBe(true);
    const elems3 = rest.getAll!('*');
    expect(elems3).toHaveLength(2);

    const memops1 = rest.getAll!(MEMOP_TAG);
    expect(memops1).toHaveLength(1);

    const modMems1 = rest.getAll!(MODULE_MEMORY_TAG);
    expect(modMems1).toHaveLength(0)

    //
    // Adding second extension with modules
    //
    const postedExt2 = rest.post!('*', builtInExt2, {});
    expect(postedExt2.isSuccess).toBe(true);
    const memops2 = rest.getAll!(MEMOP_TAG);
    expect(memops2).toHaveLength(2);
    
    const modMems2 = rest.getAll!('module.node_modules');
    expect(modMems2).toHaveLength(modulesPutted.getValue().length);
    // Make sure that module memories are fetchable
    const firstModuleLink = modulesPutted.getValue()[0].moduleURL
	    .replaceAll(':', '_-').replaceAll('/', '__-').replaceAll('@', '___-').replaceAll('.', '____-');
    const firstModuleLinkStr1 = `file_-__-__-__-home__-milay__-ara-web__-packages__-reflect__-node_modules__-___-ara-web__-p-hintjens__-dist__-debug____-js`;
    expect(firstModuleLink).toEqual(firstModuleLinkStr1);
    const firstModuleNode = rest.get!(`#${firstModuleLinkStr1}`);
    expect(firstModuleNode !== null).toBe(true);
    const firstModule = firstModuleNode?.getElement()! as ModuleMemory<unknown>;
    expect(firstModuleNode?.selector).toEqual(firstModule.rest.rootNode.selector);

    // Make sure that module memories are under the memory operations.
    const moduleChildren = rest.getAll!('memop > module');
    expect(moduleChildren.length > 0).toBe(true);
})

// test(`Object Tree building from code piece as Module Memory Child`, async() => {
//     // Build the extension
//     const projectMemory = new ProjectMemory();
//     const builtInExt2 = new Reflect({packageLink: ModuleLink.newPackageURL('', 'reflect2')}).nodeJsExt

//     const categorizedModules = getSampleModuleData();
//     // After adding the records
//     const modulesPutted = await builtInExt2.putModules(categorizedModules);

//     // Make sure it's parsing.
//     // Add to the extensions the some modules
//     // Make sure modules are the children of the element
//     const rest = new Rest(projectMemory!, reflectElementToObjectTree);
//     const postedExt2 = rest.post!('*', builtInExt2, {});
//     expect(postedExt2.isSuccess).toBe(true);
//     const elems1 = rest.getAll!('*');
    
//     const memops2 = rest.getAll!(MEMOP_TAG);
//     expect(memops2).toHaveLength(1);
    
//     // memop#pkg:bookbike.vn > module[fileName='index.py'] > #varName

//     const modMems2 = rest.getAll!(MODULE_MEMORY_TAG);
//     expect(modMems2).toHaveLength(modulesPutted.getValue().length)

//     const firstModuleLink = modulesPutted.getValue()[0].moduleURL
// 	    .replaceAll(':', '_-').replaceAll('/', '__-').replaceAll('@', '___-').replaceAll('.', '____-');
//     const firstModuleNode = rest.get!(`#${firstModuleLink}`);
//     expect(firstModuleNode !== null).toBe(true);
//     const firstModule = firstModuleNode?.getElement()! as ModuleMemory<unknown>;
//     expect(firstModuleNode?.selector).toEqual(firstModule.rest.rootNode.selector);

//     //
//     // Trying to fetch code pieces from module memory
//     //
//     const typeName = 'CustomType';
//     const varName = 'varName';
//     let src = ` export type ${typeName} = { name: string; sex: number };` +
//         `const ${varName} = 'Hello and Welcome'`;
//     let code = new Code(src, ModuleLink.newFileURL(import.meta.filename));
    
//     // Add types and lint them.
//     const elems2 = rest.getAll!('*');
//     const parentElems = firstModule.rest.getAll!('*')!
//     let types = await code.getTypeIdentifiers();
//     expect(types.isSuccess).toBe(true);
//     types.getValue().forEach((importedCodePiece) => {
//         const posted = firstModule.rest.post!('*', importedCodePiece, {});
//         expect(posted.isSuccess).toBe(true);
//     });

//     const elems3 = rest.getAll!('*');
//     const parentElemsAfter = firstModule.rest.getAll!('*');
//     expect(elems3.length).toBe(elems2.length + types.getValue().length)
//     expect(parentElems.length + types.getValue().length).toBe(parentElemsAfter.length)
//     // Make sure to test from rest now.
//     const allSelectors = rest.getAll!('*').map(node => node.selector);
//     const codePiece = rest.get!('type#CustomType');
//     expect(codePiece !== null).toBe(true);

//     // Posting from the rest not from code piece rest should work
//     let vars = await code.getVariableIdentifiers();
//     expect(vars.isSuccess).toBe(true);
//     expect(vars.getValue()).toHaveLength(1);
//     vars.getValue().forEach((importedCodePiece) => {
//         const posted = rest.post!(`#${firstModuleLink}`, importedCodePiece, {});
//         expect(posted.isSuccess).toBe(true);
//     });

//     const elems4 = rest.getAll!('*');
//     const parentElemsAfterVars = firstModule.rest.getAll!('*');
//     expect(elems4.length).toBe(elems3.length + vars.getValue().length)
//     expect(parentElemsAfter.length + vars.getValue().length).toBe(parentElemsAfterVars.length)

//     const varCodePiece = firstModule.rest.get!(`#${varName}`);
//     expect(varCodePiece !== null).toBe(true);
// })

// Adding the modules after creating the rest.
// Create a rest with the project memory and extension.
// then put modules into the extension. extension should call the rest.
test(`Modules added after rest instance, must work`, async() => {
    // Project Memory is the root node of our reflect
    const projectMemory = new ProjectMemory();
    // The child nodes of project memory.
    // It should be:
    // #document -> memop#pkg
    // #document -> memop#pkg
    const builtInExt2 = new Reflect({packageLink: ModuleLink.newPackageURL('', 'reflect2')}).nodeJsExt
    
    //
    // The Rest operations
    //

    // Root node works?
    const restProxy = new RestReflectHookProxy();
    const restRaw = new Rest(projectMemory!, reflectElementToObjectTree, {proxies: [restProxy], packageLink: ModuleLink.newPackageURL('@ara-web', 'rest')});
    const proxied = restRaw.proxifyMe<RestReflectHookProxy>();
    expect(proxied.isSuccess).toBe(true);
    const rest = proxied.getValue();
    const elems1 = await rest.getAll!('*');
    expect(elems1).toHaveLength(1);
    expect(elems1[0].selector === DOCUMENT_SELECTOR);

    //
    // Adding second extension with modules
    //
    const postedExt2 = await rest.post!('*', builtInExt2, {});
    expect(postedExt2.isSuccess).toBe(true);
    const memops2 = await rest.getAll!(MEMOP_TAG);
    expect(memops2).toHaveLength(1);
    const fetchedExt = await rest.get!(`#${escapeId(builtInExt2.moduleLink.toString())}`)
    expect(fetchedExt !== null).toBe(true);
    const modMems1 = await rest.getAll!(MODULE_MEMORY_TAG);
    expect(modMems1).toHaveLength(0);

    // Child nodes of extension: module memories
    // It should be:
    // #document -> memop -> module-memory
    const categorizedModules = getSampleModuleData();
    // After adding the records
    expect(builtInExt2.untrackedModuleAmount).toBe(0);
    const modulesPutted = await builtInExt2.putModules(categorizedModules);
    expect(modulesPutted.isSuccess).toBe(true);
    expect(builtInExt2.untrackedModuleAmount).toEqual(modulesPutted.getValue().length)

    const modMems2 = await rest.getAll!('module.node_modules');
    expect(modMems2).toHaveLength(modulesPutted.getValue().length);
    // Make sure that module memories are fetchable
    const firstModuleLink = modulesPutted.getValue()[0].moduleURL
	    .replaceAll(':', '_-').replaceAll('/', '__-').replaceAll('@', '___-').replaceAll('.', '____-');
    const firstModuleLinkStr1 = `file_-__-__-__-home__-milay__-ara-web__-packages__-reflect__-node_modules__-___-ara-web__-p-hintjens__-dist__-debug____-js`;
    expect(firstModuleLink).toEqual(firstModuleLinkStr1);
    const firstModuleNode = await rest.get!(`#${firstModuleLinkStr1}`);
    expect(firstModuleNode !== null).toBe(true);
    const firstModule = firstModuleNode?.getElement()! as ModuleMemory<unknown>;
    expect(firstModuleNode?.selector).toEqual(firstModule.rest.rootNode.selector);

    // Make sure that module memories are under the memory operations.
    const moduleChildren = await rest.getAll!('memop > module');
    expect(moduleChildren.length > 0).toBe(true);
})