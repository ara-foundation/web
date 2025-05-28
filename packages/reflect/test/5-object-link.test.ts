import { expect, test } from "vitest";
import { DOCUMENT_SELECTOR, ModuleLink, Rest, RestHandler, ExtensionOperator, Setup, RestfulExtensionOperator } from "@ara-web/sds";
import { MEMOP_TAG, MODULE_MEMORY_TAG, ModuleManager, Module, ChiefModuleManager, Reflect, reflectDataToObjectTree, type ReflectDataType } from "../src/index";
import { getImportRecords as getSampleModuleData } from "./shared.js";
import { RestReflectHookProxy } from "../src/rest-reflect-hook-proxy.js";
import { escapeId } from "../src/reflect-object-tree.js";
import { BuiltinModuleManager } from "../src/builtin-module-manager.js";

const elementType = (element: ReflectDataType): string => {
    if (element instanceof Module) {
        return `Module Memory('${element.link.url}')`
    } else if (element instanceof ChiefModuleManager) {
        return `Project Memory('')`
    } else if ("memoryOperatorId" in element) {
        return `Extension('${element.memoryOperatorId}')`
    }
    return 'unknown'
}

class NodejsModuleManager2 extends BuiltinModuleManager {
    constructor() {
        super();
        this._moduleLink = ModuleLink.newPackageLink("@ara-web", "reflect-nodejs-ext2");
    }
}

test(`Object Tree building from module operators and modules work`, async() => {
    // Project Memory is the root node of our reflect
    const pkgLink = ModuleLink.newPackageLink('@ara-web', 'object-link-test');
    const extOperator = new ExtensionOperator([]);
    const projectMemory = new ChiefModuleManager(extOperator);
    // The child nodes of project memory.
    // It should be:
    // #document -> memop#pkg
    // #document -> memop#pkg
    const builtInExt1 = new BuiltinModuleManager();
    const builtInExt2 = new BuiltinModuleManager();
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
    // Rest options receives the Reflect's extension's rest dispatcher that
    // is hooked everytime for the extension's operators.
    const restOptions = {packageLink: pkgLink, extensions: [projectMemory.restDispatcher]};
    const rest = new Rest<any>(projectMemory!, reflectDataToObjectTree, restOptions);
    const elems1 = await rest.getAll!('*');
    expect(elems1).toHaveLength(1);
    expect(elems1[0].selector === DOCUMENT_SELECTOR);
    const restfulLinked = await projectMemory.setRestDispatcherOperator(rest);
    expect(restfulLinked.isSuccess).toBe(true);

    // Add memop to root node
    const postedExt = await rest.post!('*', builtInExt1, {});
    expect(postedExt.isSuccess).toBe(true);
    const elems3 = await rest.getAll!('*');
    expect(elems3).toHaveLength(2);

    const memops1 = await rest.getAll!(MEMOP_TAG);
    expect(memops1).toHaveLength(1);

    const modMems1 = await rest.getAll!(MODULE_MEMORY_TAG);
    expect(modMems1).toHaveLength(0)

    // Before adding the second extension, let's remove the first one, since duplicates not allowed
    const deleted = await rest.delete!(MEMOP_TAG)
    expect(deleted.isSuccess).toBe(true);

    const afterDeletion = await rest.getAll!('*');
    expect(afterDeletion).toHaveLength(1);

    //
    // Adding second extension with modules
    //
    const postedExt2 = await rest.post!('*', builtInExt2, {});
    expect(postedExt2.isSuccess).toBe(true);

    // Call the beforeGet to apply all modules
    const memops2 = await rest.getAll!(MEMOP_TAG);
    expect(memops2).toHaveLength(1);
    
    const modMems2 = await rest.getAll!('module.node_modules');
    expect(modMems2).toHaveLength(modulesPutted.getValue().length);
    // Make sure that module memories are fetchable
    const firstModuleLink = escapeId(modulesPutted.getValue()[0].url);
    const firstModuleLinkStr1 = `file_-__-__-__-home__-milay__-ara-web__-packages__-reflect__-node_modules__-___-ara-web__-p-hintjens__-dist__-debug____-js`;
    expect(firstModuleLink).toEqual(firstModuleLinkStr1);
    const firstModuleNode = await rest.get!(`#${firstModuleLinkStr1}`);
    expect(firstModuleNode !== null).toBe(true);
    expect(firstModuleNode?.data instanceof Module).toBe(true);

    // Make sure that module memories are under the memory operations.
    const moduleChildren = await rest.getAll!('memop > module');
    expect(moduleChildren.length > 0).toBe(true);
})

test(`Object Tree building from code piece as Module Memory Child`, async() => {
    // Build the extension
    const pkgLink = ModuleLink.newPackageLink('@ara-web', 'object-link-test');
    const extOperator = new ExtensionOperator([]);
    const projectMemory = new ChiefModuleManager(extOperator);
    
    const builtInExt2 = new BuiltinModuleManager();

    const categorizedModules = getSampleModuleData();
    // After adding the records
    const modulesPutted = await builtInExt2.putModules(categorizedModules);

    // Make sure it's parsing.
    // Add to the extensions the some modules
    // Make sure modules are the children of the element
    const restOptions = {packageLink: pkgLink, extensions: [projectMemory.restDispatcher]};
    const rest = new Rest<any>(projectMemory!, reflectDataToObjectTree, restOptions);
    const restfulLinked = await projectMemory.setRestDispatcherOperator(rest);
    expect(restfulLinked.isSuccess).toBe(true);

    const postedExt2 = await rest.post!('*', builtInExt2, {});
    expect(postedExt2.isSuccess).toBe(true);
    
    const memops2 = await rest.getAll!(MEMOP_TAG);
    expect(memops2).toHaveLength(1);
    
    // memop#pkg:bookbike.vn > module[fileName='index.py'] > #varName
    // Make sure to imitate calling the beforeHook
    const modMems2 = await rest.getAll!(MODULE_MEMORY_TAG);
    expect(modMems2).toHaveLength(modulesPutted.getValue().length)

    const firstModuleLink = escapeId(modulesPutted.getValue()[0].url)
    const firstModuleNode = await rest.get!(`#${firstModuleLink}`);
    expect(firstModuleNode !== null).toBe(true);
    expect(firstModuleNode?.data instanceof Module).toBe(true);
})

// Adding the modules after creating the rest.
// Create a rest with the project memory and extension.
// then put modules into the extension. extension should call the rest.
test(`Modules added after rest instance, must work`, async() => {
    const pkgLink = ModuleLink.newPackageLink('object-link-test', 'add-instance');
    const extOperator = new ExtensionOperator([]);
    const projectMemory = new ChiefModuleManager(extOperator);
    // The child nodes of project memory.
    // It should be:
    // #document -> memop#pkg
    // #document -> memop#pkg
    const nodejsModuleManager = new BuiltinModuleManager();
    const nodejsModuleManager2 = new NodejsModuleManager2();
    //
    // The Rest operations
    //
    // Root node works?
    const restProxy = new RestReflectHookProxy();
    const restOptions: Setup = {
        proxies: [restProxy],
        extensions: [projectMemory.restDispatcher],
        packageLink: pkgLink
    }
    const restRaw = new Rest<any>(projectMemory!, reflectDataToObjectTree, restOptions);
    const proxied = restRaw.proxifyMe<RestReflectHookProxy>();
    expect(proxied.isSuccess).toBe(true);
    const rest = proxied.getValue();
    const restfulLinked = await projectMemory.setRestDispatcherOperator(rest);
    expect(restfulLinked.isSuccess).toBe(true);
    const elems1 = await rest.getAll!('*');
    expect(elems1).toHaveLength(1);
    expect(elems1[0].selector === DOCUMENT_SELECTOR);
    // We need to link nodejs module manager with the rest,
    // if we want nodejs module manager to be working
    nodejsModuleManager.setRestSyncer(elems1[0], reflectDataToObjectTree);
    // Add extension using rest
    const postedExt2 = await rest.post!('*', nodejsModuleManager);
    expect(postedExt2.isSuccess).toBe(true);
    const postedExt3 = await rest.post!('*', nodejsModuleManager);
    expect(postedExt3.isFailure).toBe(true);
    
    const memops2 = await rest.getAll!(MEMOP_TAG);
    expect(memops2).toHaveLength(1);
    const fetchedExt = await rest.get!(`#${escapeId(nodejsModuleManager.packageLink.toString())}`)
    expect(fetchedExt !== null).toBe(true);
    const modMems1 = await rest.getAll!(MODULE_MEMORY_TAG);
    expect(modMems1).toHaveLength(0);

    // Child nodes of extension: module memories
    // It should be:
    // #document -> memop -> module-memory
    const categorizedModules = getSampleModuleData();
    // After adding the records
    const modulesPutted = await nodejsModuleManager.putModules(categorizedModules);
    expect(modulesPutted.isSuccess).toBe(true);

    const modMems2 = await rest.getAll!('module.node_modules');
    expect(modMems2).toHaveLength(modulesPutted.getValue().length);
    // Make sure that module memories are fetchable
    const firstModuleLink = escapeId(modulesPutted.getValue()[0].url)
    const firstModuleLinkStr1 = `file_-__-__-__-home__-milay__-ara-web__-packages__-reflect__-node_modules__-___-ara-web__-p-hintjens__-dist__-debug____-js`;
    expect(firstModuleLink).toEqual(firstModuleLinkStr1);
    const firstModuleNode = await rest.get!(`#${firstModuleLinkStr1}`);
    expect(firstModuleNode !== null).toBe(true);
    expect(firstModuleNode?.data instanceof Module).toBe(true);


    // Make sure that module memories are under the memory operations.
    const moduleChildren = await rest.getAll!('memop > module');
    expect(moduleChildren.length > 0).toBe(true);
})

// Adding the extension using extension operator
// and the extension must be retrieval from the rest.
test(`Adding extension using extension operator`, async() => {
    const pkgLink = ModuleLink.newPackageLink('object-link-test', 'add-extension');
    const extOperator = new ExtensionOperator([]);
    const projectMemory = new ChiefModuleManager(extOperator);
    // The child nodes of project memory.
    // It should be:
    // #document -> memop#pkg
    // #document -> memop#pkg
    const nodejsModuleManager = new BuiltinModuleManager();

    const restOptions = {packageLink: pkgLink, extensions: [projectMemory.restDispatcher]};
    const rest = new Rest<any>(projectMemory!, reflectDataToObjectTree, restOptions);
    const restfulLinked = projectMemory.setRestDispatcherOperator(rest);
    expect(restfulLinked.isSuccess).toBe(true);

    const memops1 = await rest.getAll!(MEMOP_TAG);
    expect(memops1).toHaveLength(0);

    const created = await projectMemory.addExtension(nodejsModuleManager);
    expect(created.isSuccess).toBe(true);
    
    const memops2 = await rest.getAll!(MEMOP_TAG);
    expect(memops2).toHaveLength(1);
})

// TODO 2
// Make sure to add reflectExtOperator.add() with the extension that has modules.
// TODO 3
// Make sure to add rest.post(ext with modules)
