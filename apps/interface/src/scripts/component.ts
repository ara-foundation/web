import { globsToComponents, ModuleType } from "@ara-web/reflect";
import { type Component, type ComponentCategory, Result } from "@ara-web/ts-enhancement";
import { ComponentEngine } from "@ara-web/component-engine";

// export const getComponentByPath = async (modulePath: string, moduleType?: ModuleType): Promise<Result<Component>> => {
//     const componentId = ComponentEngine.modulePathToCategoryFileName(modulePath);
//     if (componentId.isFailure) {
//         return Result.fail(
//             `modulePathToCategory(modulePath: '${modulePath}'): ${componentId.errorTitle}`,
//             componentId.errorDescription!
//         )
//     }
//     const {fileName, category} = componentId.getValue()!

//     const components = await getComponents(moduleType)
//     if (components.isFailure) {
//         return Result.fail(
//             `getComponents(moduleType: '${moduleType}'): ${components.errorTitle}`,
//             components.errorDescription!
//         )
//     }
//     if (components.getValue().length === 0) {
//         return Result.fail(`No components were found`, `Make sure src/scripts/component.ts is working properly`)
//     }

//     for (let i = 0; i < components.getValue().length; i++) {
//         const component = components.getValue()[i];
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


// Called by page resource on 'ara/lungta/ara-web/page/get' URI.
// Use the @component-engine and @reflect
// Load the component globs.
// Then, load the reflect's component<fileContentsToComponents<Glob> -> Convert glob to file>
export const getComponents = async (moduleType?: ModuleType): Promise<Result<Component[]>> => {
    const globs = getGlobs(moduleType);

    let components = await globsToComponents(globs);

    if (components.isFailure) {
        return Result.fail(
            `globsToComponents(): ${components.errorTitle}`,
            components.errorDescription!
        )
    }

    return Result.ok(components.getValue());
}

const getGlobs = (moduleType?: ModuleType): Record<string, unknown> => {
    let layoutGlobs = import.meta.glob('@layouts/**/*.{astro,tsx,jsx}', {eager: true})//relative to this component file
    let componentGlobs = import.meta.glob('@components/**/*.{astro,tsx,jsx}', {eager: true})
    let globs: typeof layoutGlobs;
    if (moduleType !== undefined) {
        if (moduleType === ModuleType.Component) {
            globs = componentGlobs;
        } else if (moduleType === ModuleType.Layout) {
            globs = layoutGlobs;
        } else {
            globs = {...layoutGlobs, ...componentGlobs};
        }
    } else {
        globs = {...layoutGlobs, ...componentGlobs};
    }
    return globs;
}

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


// const fileContentsToComponents = (fileContents: FileContent[]): Component[] => {
//     let components: Component[] = [];

//     for (let fileContent of fileContents) {
//         if (fileContent.error) {
//             console.error(`File Error(${fileContent.filePath}): ${fileContent.error}`)
//             continue;
//         }
//         const component: Component = {
//             label: "",
//             description: "",
//             fileName: "",
//             category: componentCategories[0],
//             glob: fileContent.glob,
//         }

//         for (const componentCategory of componentCategories) {
//             const indexOf = fileContent.filePath.indexOf(componentCategory.slug)
//             if (indexOf === -1) {
//                 continue;
//             }

//             const fileName = fileContent.filePath.substring(indexOf + componentCategory.slug.length)
//             component.category = componentCategory;
//             component.fileName = fileName;
//             components.push(component);
//             break;
//         }
//     }

//     return components;
// }

