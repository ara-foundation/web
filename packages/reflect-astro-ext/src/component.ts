// The component engine.
// List of components and fetching them by a simple class. 

import { type Component, Result } from "@ara-web/ts-enhancement";

// Move the parts to the Astro Framework itself.
// TODO:
// Make sure to allow supported components to the Astro Reflect Extension.
// import { ComponentEngine, componentCategories } from "@ara-web/component-engine"
import type { ModuleMemory } from "@ara-web/reflect/memory";

import type { ComponentNode as AstroComponentNode, ElementNode, ExpressionNode } from "@astrojs/compiler/types";
import type { Props } from "astro";
// Which types of Components supported?
export type AstroNode = ElementNode | ExpressionNode | AstroComponentNode
// WARNING: Every time whenever a new extension added, add support here.
export type AstroNodeType = ((_props: Props) => any) | (({ children }: Props) => React.JSX.Element) | (() => React.JSX.Element);

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

export const fileContentToComponent = async (memory: ModuleMemory<unknown>): Promise<Result<Component>> => {
    return Result.errorCode501(["component"], "fileContentToComponent")
    // const component: Component = {
    //     label: "",
    //     description: "",
    //     modulePath: "",
    //     category: componentCategories[0],
    //     glob: memory.glob,
    // }

    // const componentId = ComponentEngine.modulePathToCategoryFileName(memory.modulePath);
    // if (componentId.isFailure) {
    //     return Result.fail(
    //         `modulePathToCategory(modulePath: '${memory.modulePath}'): ${componentId.errorTitle}`,
    //         componentId.errorDescription!
    //     )
    // }
    // const {fileName, category} = componentId.getValue()!
    // component.category = category;
    // component.modulePath = fileName;

    // return Result.ok(component);
}
