/**
 * Testing the functions for the setup of the plugin into the website,
 * which means setting up shared modules.
 */

import { expect, test } from "vitest";
import { ModulePartitioner, FileExtension, CodeLevel, AstroBuiltInIdentifiers } from "../src";
import { getImportRecords, getNewAstroReflect, getNewProjectMemory } from "./shared";
import { CodePiece, codePieceOps } from "@ara-web/reflect";
import { ObjectNode } from "@ara-web/sds";
import { Debug } from "@ara-web/p-hintjens";

test(`Make sure the that code is importing`, async () => {
    const modules = getImportRecords()
      
    const reflectExtension = await getNewAstroReflect();
    const validated = await reflectExtension.putModules(modules);
    expect(validated.isSuccess).toBe(true);
    // Make sure they are all no content moduled
    const projectMemory = getNewProjectMemory(reflectExtension);
    const astroBuiltInIdentifiers = await AstroBuiltInIdentifiers.getBuiltInIdentifiers();
    expect(astroBuiltInIdentifiers.isSuccess).toBe(true);
    const moduleMemories = projectMemory.getModules();
    expect(Object.keys(moduleMemories).length).toBeGreaterThan(0);
    for (let moduleMemory of moduleMemories) {
        astroBuiltInIdentifiers.getValue().forEach((importedCodePiece) => {            
            const posted = moduleMemory.rest.post!('*', importedCodePiece);
            expect(posted.isSuccess).toBe(true);
        });
        const moduleParts = await ModulePartitioner.partition(moduleMemory);
        expect(moduleParts.isSuccess).toBe(true);
    
        if (moduleParts.getValue().fileExtension !== FileExtension.Astro) {
            continue;
        } 
    
        const identifiedSourceCode = await CodeLevel.identifySourceCode(moduleParts.getValue().source, moduleMemory, projectMemory);
        expect(identifiedSourceCode.isSuccess).toBe(true);
    }
})