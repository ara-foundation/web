/**
 * Testing the functions for the setup of the plugin into the website,
 * which means setting up shared modules.
 */
import { expect, test } from "vitest";
import { getImportRecords, getNewAstroReflect, getNewProjectMemory } from "./shared";
import { AstroAraWebExtension } from "../src";
import { ModuleMemory, Reflect } from "@ara-web/reflect";
import { CodeLevel, FileExtension, ModuleCategory, ModulePartitioner, Page, PageLevel, AstroBuiltInIdentifiers } from "@ara-web/reflect-astro-ext";
import { componentCategories } from "../src/astro-ara-web-ext";
import { Debug, ModuleLink } from "@ara-web/p-hintjens";

test(`Make sure the that RPC Call is detected`, async () => {
    const modules = getImportRecords()
    const araWebExtension = new AstroAraWebExtension();
    const reflectExtension = await getNewAstroReflect([araWebExtension]);
    const validated = await reflectExtension.putModules(modules);
    expect(validated.isSuccess).toBe(true);
    // Make sure they are all no content moduled
    const projectMemory = getNewProjectMemory(reflectExtension);

    const myUrl = ModuleLink.newPackageURL("@ara-web", "reflect-astro-plugins-test");
    const reflectAstroPluginImportClause = "@ara-web/reflect-astro-plugins";
    const reflectAstroPluginModule = await import(reflectAstroPluginImportClause);

    const reflect = new Reflect({packageLink: myUrl});
    const putted = await reflect.nodeJsExt.putPackage({importModuleClause: reflectAstroPluginImportClause, module: reflectAstroPluginModule});
    expect(putted.isSuccess).toBe(true);
    projectMemory.putMemoryOperations(reflect.nodeJsExt)
    const module = reflect.nodeJsExt.getModule(ModuleLink.newPackageURLFromImportClause(reflectAstroPluginImportClause + "/components/astro.call"));
    expect(module.isSuccess).toBe(true);

    const moduleMemories = projectMemory.getModules();
    expect(Object.keys(moduleMemories).length).toBeGreaterThan(0);
    for (let moduleMemory of moduleMemories) {
        if (!([
                ModuleCategory.Page,
                ModuleCategory.Component, 
                ModuleCategory.Layout
            ].includes(moduleMemory.moduleCategory as ModuleCategory))) {
            continue;
        }
        if (moduleMemory.moduleLink.moduleURL.indexOf("redirect.astro") === -1) {
            continue;
        }
        Debug.log(`Redirect astro entered`)
        const moduleParts = await ModulePartitioner.partition(moduleMemory);
        expect(moduleParts.isSuccess).toBe(true);
    
        if (moduleParts.getValue().fileExtension !== FileExtension.Astro) {
            continue;
        }
        const identifiedSourceCode = await CodeLevel.identifySourceCode<Page>(moduleParts.getValue().source, moduleMemory as ModuleMemory<Page>, projectMemory);
        Debug.log(`Identified source code:`)
        Debug.log(identifiedSourceCode)
        expect(identifiedSourceCode.isSuccess).toBe(true);

        const identifiers = await AstroBuiltInIdentifiers.getBuiltInIdentifiers();
        expect(identifiers.isSuccess).toBe(true);
        moduleMemory.addIdentifiers(identifiers.getValue());
        
        // Test by using ObjectLinkSelector.
        // Uncomment to see the object links.
        const page = await PageLevel.identify<Page>(moduleParts.getValue(), identifiedSourceCode.getValue(), projectMemory);
        expect(page.isSuccess).toBe(true);
        expect(page.getValue().description.length).toBe(0);

        moduleMemory.content = page.getValue();

        const identifiedPage = await araWebExtension.afterPageLvlIdenfication!(moduleMemory.moduleCategory, moduleMemory as ModuleMemory<Page>, projectMemory);
        expect(identifiedPage.isSuccess).toBe(true);
        if (moduleMemory.moduleLink.toFilePath.indexOf("layouts/") > 0) {
            expect(identifiedPage.getValue().content?.description === componentCategories[6].description).toBe(true);
        } else if (moduleMemory.moduleLink.toFilePath.indexOf("lungta") > 0) {
            expect(identifiedPage.getValue().content?.description === componentCategories[3].description).toBe(true);
        }
    }
})
