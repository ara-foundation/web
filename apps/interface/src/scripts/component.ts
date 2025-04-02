// The component engine.
// List of components and fetching them by a simple class. 
import GapContainer from "@components/auth/GapContainer";   // react typescript
import AraContact from "@components/lungta/AraContact"      // react javascript
import type { Props } from "astro";
import { globsToFileContents, type FileContent } from "@scripts/reflect/fileLevel";
                                                            // WARNING: Every time whenever a new extension added, 
                                                            // add support here.

export type ElementType = ((_props: Props) => any) | typeof GapContainer | typeof AraContact;

export type ComponentCategory = {
    name: string;
    slug: string;
    description: string;
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
}, {
    name: "Layout",
    slug: "layouts/",
    description: "Components that used to build nested components for pages"
}];

const AraWebLayoutPath = "layouts/AraWebLayout.astro";

export type Component = {
    label: string;
    description: string;
    category: ComponentCategory;
    fileName: string;
    glob: unknown,
}

export type Expression = {
    prefix: string;
    firstElement: Component;
    suffix: string;
}


export const isLayout = (filePath: string): boolean => {
    return (filePath.indexOf(AraWebLayoutPath) > -1);
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

