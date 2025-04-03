// The component engine.
// List of components and fetching them by a simple class. 
import GapContainer from "@components/auth/GapContainer";   // react typescript
import AraContact from "@components/lungta/AraContact"      // react javascript
import type { Props } from "astro";
import { globsToFileContents, type FileContent } from "@scripts/reflect/fileLevel";
import type { Component, ComponentCategory } from "@scripts/araWebOntology";
import type { ComponentNode, ElementNode } from "@astrojs/compiler/types";
import { capitalizeFirstLetter } from "@scripts/string";
import { Result } from "@scripts/result";
                                                            // WARNING: Every time whenever a new extension added, 
                                                            // add support here.

export type ElementType = ((_props: Props) => any) | typeof GapContainer | typeof AraContact;

const elementCategory: ComponentCategory = {
    name: "WWW",
    slug: "html",
    description: `The basic web component that composes the Web Elements also known as HTML`,
}

export const expressionCategory: ComponentCategory = {
    name: "Expression",
    slug: "",
    description: `The expression is the dynamic components inserted by Astro Framework`
}

export const layoutCategory: ComponentCategory = {
    name: "Layout",
    slug: "layouts/",
    description: "Components that used to build nested components for pages"
}

export const componentCategories: ComponentCategory[] = [{
    name: "Authentication",
    slug: "components/auth",
    description: "Authentication made by google and ZK, which require the components specific for this"
}, {
    name: "Content",
    slug: "components/content",
    description: "Content usually means the central part of the web pages, components specifically for page content"
}, {
    name: "Header",
    slug: "components/header",
    description: "The components such as Ara, Notification and Ara services links (navigation), used in Web Ara"
}, {
    name: "Lungta",
    slug: "components/lungta",
    description: "The Lungta components are specific for Web Navigation on the Left Side of the web pages, " +
        "besides lungta navigation, it also holds components for Lungta Gift"
}, {
    name: "components/Resource",
    slug: "components/resource",
    description: "Components designed to represent the resources as the medium betwen JSON-AD and Web UI, here holds the components that answer to show it in Ara Web's Resource page"
}, {
    name: "UI (User Interface)",
    slug: "components/ui",
    description: "UI elements"
}, {
    name: "General",
    slug: "components/",
    description: "General or global components"
}, 
    layoutCategory
];

const AraWebLayoutPath = "layouts/AraWebLayout.astro";

export const isLayout = (filePath: string): boolean => {
    return (filePath.indexOf(AraWebLayoutPath) > -1);
}

/**
 * Converts the ElementNode into a Component
 * @param {ElementNode} element 
 * @returns {Component}
 */
export const elementNodeToComponent = (element: ElementNode): Component => {
    const component: Component = {
        label: `<${capitalizeFirstLetter(element.name)}>`,
        description: `Show the data`,
        category: elementCategory,
        fileName: ``,
        glob: element
    }

    return component;
}

export const layoutNodeToComponent = (node: ComponentNode, filePath: string): Component => {
    const component: Component = {
        label: `<${capitalizeFirstLetter(node.name)}>`,
        description: `Layout of the Elements`,
        category: layoutCategory,
        fileName: filePath,
        glob: node
    }

    return component;
}

export const nodeToComponent = (node: ComponentNode, filePath: string): Result<Component> => {
    const category = filePathToCategory(filePath);
    if (category === undefined) {
        return Result.fail(
            `filePathToCategory(filePath='${filePath}')`,
            `The ${node.name} not found in the Ara Web's built in components list`
        )
    }
    
    const component: Component = {
        label: node.name,
        description: "",
        fileName: filePath,
        category: componentCategories[0],
        glob: node,
    }

    return Result.ok(component);
}

const filePathToCategory = (filePath: string): ComponentCategory|undefined => {
    for (const componentCategory of componentCategories) {
        const indexOf = filePath.indexOf(componentCategory.slug)
        if (indexOf === -1) {
            continue;
        }

        const fileName = filePath.substring(indexOf + componentCategory.slug.length)
        return componentCategory;
    }

    return undefined;
}

export const getComponents = async (): Promise<Component[]> => {
    let globs = import.meta.glob('@layouts/**/*.{astro,tsx,jsx}', {eager: true})//relative to this component file
    let globItems = import.meta.glob('@components/**/*.{astro,tsx,jsx}', {eager: true})
    globs = {...globs, ...globItems};

    const fileContents = await globsToFileContents(globs);
    let components: Component[] = fileContentsToComponents(fileContents);

    return components;
}

const fileContentsToComponents = (fileContents: FileContent[]): Component[] => {
    let components: Component[] = [];

    for (let fileContent of fileContents) {
        if (fileContent.error) {
            console.error(`File Error(${fileContent.filePath}): ${fileContent.error}`)
            continue;
        }
        const component: Component = {
            label: "",
            description: "",
            fileName: "",
            category: componentCategories[0],
            glob: fileContent.glob,
        }

        for (const componentCategory of componentCategories) {
            const indexOf = fileContent.filePath.indexOf(componentCategory.slug)
            if (indexOf === -1) {
                continue;
            }

            const fileName = fileContent.filePath.substring(indexOf + componentCategory.slug.length)
            component.category = componentCategory;
            component.fileName = fileName;
            components.push(component);
            break;
        }
    }

    return components;
}


// The first slug is Category, the second is component
export const extensionToComponentSlugs = (): string[] => {
    const slugs: string[] = [];

    return slugs;
}

