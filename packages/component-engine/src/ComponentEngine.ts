import type { ComponentNode as AstroComponentNode, ElementNode, ExpressionNode } from "@astrojs/compiler/types";
import type { Props } from "astro";

import TsxComponent from "./TsxEmptyComponent"; // react typescript
import JsxComponent from "./JsxEmptyComponent"; // react javascript

import { type Component, type ComponentCategory, StringTraits, Result } from "@ara-web/ts-enhancement";
import { AraWebModuleSlugs, PurlProtocol, type AraLink } from "@ara-web/ts-enhancement/ara-link";

// Which types of Components supported?
export type AstroNode = ElementNode | ExpressionNode | AstroComponentNode
// WARNING: Every time whenever a new extension added, add support here.
export type AstroNodeType = ((_props: Props) => any) | typeof TsxComponent | typeof JsxComponent;

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

export class ComponentEngine {
    public static isLayoutModuleLink = (araLink: AraLink<string>): boolean => {
        if (!araLink.isCorrectPath(PurlProtocol, AraWebModuleSlugs)) {
            return false;
        }
    
        return ComponentEngine.isLayoutModulePath(araLink.resource);
    }
    
    private static isLayoutModulePath = (filePath: string): boolean => {
        return (filePath.indexOf(AraWebLayoutPath) > -1);
    }
    /**
     * Converts the ElementNode (HTML elements such as Body, Head, Div etc) into a Component
     * @param {ElementNode} element 
     * @returns {Component}
     */
    public static astroElementNodeToComponent = (element: ElementNode): Component => {
        const component: Component = {
            label: `<${StringTraits.capitalizeFirstLetter(element.name)}>`,
            description: `Show the data`,
            category: elementCategory,
            modulePath: ``,
            glob: element
        }

        return component;
    }

    public static astroLayoutNodeToComponent = (node: AstroComponentNode, filePath: string): Component => {
        const component: Component = {
            label: `<${StringTraits.capitalizeFirstLetter(node.name)}>`,
            description: `Layout of the Elements`,
            category: layoutCategory,
            modulePath: filePath,
            glob: node
        }

        return component;
    }

    public static astroNodeToComponent = (node: AstroComponentNode, filePath: string): Result<Component> => {
        const category = ComponentEngine.filePathToCategory(filePath);
        if (category === undefined) {
            return Result.fail(
                `filePathToCategory(filePath='${filePath}')`,
                `The ${node.name} not found in the Ara Web's built in components list`
            )
        }
        
        const component: Component = {
            label: node.name,
            description: "",
            modulePath: filePath,
            category: componentCategories[0],
            glob: node,
        }

        return Result.ok(component);
    }

    private static filePathToCategory = (filePath: string): ComponentCategory|undefined => {
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

    public static modulePathToCategoryFileName = (modulePath: string): Result<{fileName: string, category: ComponentCategory}> => {
        for (const componentCategory of componentCategories) {
            const indexOf = modulePath.indexOf(componentCategory.slug)
            if (indexOf === -1) {
                continue;
            }

            const fileName = modulePath.substring(indexOf + componentCategory.slug.length)
            
            return Result.ok({fileName, category: componentCategory})
        }

        return Result.fail(`The module path is not for component nor for layout`, `The '${modulePath}' is not detected as the component category or its name is invalid`)
    }

    // The first slug is Category, the second is component
    private static extensionToComponentSlugs = (): string[] => {
        const slugs: string[] = [];

        return slugs;
    }
}