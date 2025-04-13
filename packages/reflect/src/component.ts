// The component engine.
// List of components and fetching them by a simple class. 

import { type FileContent } from "./fileLevel.js";
import { type Component, Result } from "@ara-web/ts-enhancement";

import { ComponentEngine, componentCategories } from "@ara-web/component-engine"

// export const getComponentByPath = async (modulePath: string, moduleType?: ModuleType): Promise<Result<Component>> => {
//     const componentId = modulePathToCategoryFileName(modulePath);
//     if (componentId.isFailure) {
//         return Result.fail(
//             `modulePathToCategory(modulePath: '${modulePath}'): ${componentId.errorTitle}`,
//             componentId.errorDescription!
//         )
//     }
//     const {fileName, category} = componentId.getValue()!

//     const components = await getComponents(moduleType)
//     if (components.length === 0) {
//         return Result.fail(`No components were found`, `Make sure src/scripts/component.ts is working properly`)
//     }

//     for (let i = 0; i < components.length; i++) {
//         const component = components[i];
//         if (component.category.slug === category.slug && 
//             component.fileName === fileName) {
//                 return Result.ok(component);
//             }
//     }

//     return Result.fail(
//         `The module path not found in the components list`,
//         `The module path turned into '${fileName}' of '${category.name}' category not found in the components list`
//     )
// }

// export const componentFileContent = async (modulePath: string, moduleType?: ModuleType): Promise<Result<FileContent>> => {
//     const componentId = modulePathToCategoryFileName(modulePath);
//     if (componentId.isFailure) {
//         return Result.fail(
//             `modulePathToCategory(modulePath: '${modulePath}'): ${componentId.errorTitle}`,
//             componentId.errorDescription!
//         )
//     }
    
//     const fileContents = await getFileContents(moduleType)
//     for (let fileContent of fileContents) {
//         if (fileContent.error) {
//             console.error(`File Error(${fileContent.filePath}): ${fileContent.error}`)
//             continue;
//         }

//         const fileContentId = modulePathToCategoryFileName(fileContent.filePath);
//         if (fileContentId.isFailure) {
//             continue;
//         }

//         if (fileContentId.getValue().category.slug === componentId.getValue().category.slug &&
//             fileContentId.getValue().fileName === componentId.getValue().fileName) {
//             return Result.ok(fileContent)
//         }
//     }

//     return Result.fail(
//         `File content of the component not found`,
//         `The '${componentId.getValue().fileName}' component of '${componentId.getValue().category.name}' category as ${modulePath} module path optionally of ${moduleType} module type not found`
//     )
// }

export const fileContentToComponent = async (fileContent: FileContent): Promise<Result<Component>> => {
    const component: Component = {
        label: "",
        description: "",
        fileName: "",
        category: componentCategories[0],
        glob: fileContent.glob,
    }

    const componentId = ComponentEngine.modulePathToCategoryFileName(fileContent.filePath);
    if (componentId.isFailure) {
        return Result.fail(
            `modulePathToCategory(modulePath: '${fileContent.filePath}'): ${componentId.errorTitle}`,
            componentId.errorDescription!
        )
    }
    const {fileName, category} = componentId.getValue()!
    component.category = category;
    component.fileName = fileName;

    return Result.ok(component);
}
