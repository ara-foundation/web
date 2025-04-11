import { Debug } from "@scripts/debug";
import { globsToFileContents, type FileContent } from "@scripts/reflect/fileLevel";

export const getNodeJsModules = async (): Promise<FileContent[]> => {
    const globs = import.meta.glob([
        // @fortawesome/free-solig-svg-icons
        '../../../node_modules/@fortawesome/free-solid-svg-icons/index.mjs',
        // @fortawesome/fontawesome-svg-core
        '../../../node_modules/@fortawesome/fontawesome-svg-core/index.mjs',
        ],
        {eager: true}
    );
    const fileContents = await globsToFileContents(globs);

    return fileContents;
}

export const getNodejsModuleByPath = async (path: string): Promise<FileContent|undefined> => {
    const nodeJsModules = await getNodeJsModules();
    Debug.log(`There are ${nodeJsModules.length} modules`);
    for (let nodeJsModule of nodeJsModules) {
        const exist = nodeJsModule.filePath.indexOf(path) > -1;
        if (exist) {
            return nodeJsModule;
        }
    }

    return undefined;
}
