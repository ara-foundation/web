import { ProjectMemory, FilePath, ExtensionInterface, ImportedRecords } from "@ara-web/reflect";
import { ReflectAstroExtension } from "../src";

let categorizedModuleAmount = 0;
export const getCategorizedModuleAmount = (): number => {
    return categorizedModuleAmount;
}

export const getImportRecords = (): ImportedRecords => {
    const imported = import.meta.glob(['./test-app/src/**/*.{astro,ts,svg}'], {eager: true});
    return {
        records: imported,
        importMetaFilename: import.meta.filename
    }
}

export const getNewAstroReflect = async (): Promise<ReflectAstroExtension> => {
    const rootDir = FilePath.getFileAbsolutePath("./test-app", import.meta.dirname);
    const reflectExtension = new ReflectAstroExtension(rootDir);
    
    return reflectExtension;
}

export const getNewProjectMemory = (ext: ExtensionInterface): ProjectMemory => {
    // Make sure they are all no content moduled
    const projectMemory = new ProjectMemory();
    projectMemory.putMemoryOperations(ext);
    return projectMemory;
}