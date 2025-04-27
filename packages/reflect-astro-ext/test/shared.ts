import { CategorizedModules, ExtensionInterface } from "@ara-web/reflect";
import { getFileAbsolutePath } from "@ara-web/reflect/module"
import { ProjectMemory } from "@ara-web/reflect/memory";
import { expect } from "vitest";

let categorizedModuleAmount = 0;
export const getCategorizedModuleAmount = (): number => {
    return categorizedModuleAmount;
}

export const getImportRecords = (): Record<string, unknown> => {
    const imported = import.meta.glob(['/test/test-app/**/*.{astro,ts}'], {eager: true});
    const records: Record<string, unknown> = {};

    categorizedModuleAmount = 0;
    for (let rawModulePath in imported) {
        const absolutePath = getFileAbsolutePath(rawModulePath);
        records[absolutePath] = imported[rawModulePath];
        categorizedModuleAmount++;
    }

    return records;
}

const absoluteComponentPath = process.cwd().substring(1) + '/test/test-app/src/components/Welcome.astro';
export const welcomeComponentPath = `pkg:npm/%40ara-web/reflect-astro-ext?category=components#${absoluteComponentPath}`;

export const getNewProjectMemory = (ext: ExtensionInterface, modules: CategorizedModules): ProjectMemory => {
    // Make sure they are all no content moduled
    const projectMemory = new ProjectMemory();
    projectMemory.putModuleLinksBuilder(ext.getPossibleModuleLinks);
    for (let moduleCategory in modules) {
        for (let modulePath in modules[moduleCategory]) {
            const moduleLink = ext.getNewModuleLink(moduleCategory, modulePath);
            const moduleData = modules[moduleCategory][modulePath];
            const moduleMemory = ext.getNewModuleMemory(moduleLink.getValue(), moduleData.glob);
            expect(moduleMemory.isSuccess).toBe(true);
    
            projectMemory.putModuleMemory(moduleMemory.getValue());
        }
    }
    return projectMemory;
}