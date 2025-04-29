import type { Node } from "@astrojs/compiler/types";
import type { Props } from "astro";
import type { AstroNode } from "./ontology/index.js";


// WARNING: Every time whenever a new extension added, add support here.
type AstroImport = ((_props: Props) => any);
type TsxImport = (({ children }: Props) => React.JSX.Element);
type JsxImport = (() => React.JSX.Element);
export type AstroNodeType = AstroImport | TsxImport | JsxImport;

export class AstroNodeTraits {
    public static componentName = (astNode: AstroNode): string => {
        if (astNode.type === "expression") {
            return `Expression with ${astNode.children[0].type}`
        }
        return astNode.name;
    }

    public static isSupportedNode = (node: Node): boolean => {
        return node.type === "component" || node.type === "element" || node.type === "expression"
    }
}

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

// export const fileContentToComponent = async (_: ModuleMemory<unknown>): Promise<Result<AraComponent>> => {
    // return Result.errorCode501(["component"], "fileContentToComponent")
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
// }
