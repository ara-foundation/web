// The pages engine.
// List of pages and fetching them by this script. 
export enum RowSlug {
    Header = "header",
    Content = "content",
    Footer = "footer",
}
export enum ColumnSlug {
    Left = "left",
    Center = "center",
    Right = "right",
}

export const fullSlug = (row: RowSlug, column: ColumnSlug): string => {
    return `${row}-${column}`
}

export const contentLeftSlug = fullSlug(RowSlug.Content, ColumnSlug.Left);
export const contentRightSlug = fullSlug(RowSlug.Content, ColumnSlug.Right);

export const getPages = (): Component[] => {
    // There are Markdown (.md extension) files that we won't count.
    const pageGlobs = import.meta.glob('../pages/**/*.{astro}')

    let components: Component[] = [];
    components.push(...pageGlobsToPages(pageGlobs));

    return components;
}

const pageGlobsToPages = (globs: Record<string, unknown>): Component[] => {
    let components: Component[] = [];

    // for (let componentPath in globs) {
    //     const component: Component = {
    //         label: "",
    //         description: "",
    //         fileName: "",
    //         category: componentCategories[0],
    //         glob: globs[componentPath],
    //     }

    //     for (const componentCategory of componentCategories) {
    //         const indexOf = componentPath.indexOf(componentCategory.slug)
    //         if (indexOf === -1) {
    //             continue;
    //         }

    //         const fileName = componentPath.substring(indexOf + componentCategory.slug.length)
    //         component.category = componentCategory;
    //         component.fileName = fileName;
    //         components.push(component);
    //         break;
    //     }
    // }

    return components;
}


// The first slug is Category, the second is component
export const extensionToComponentSlugs = (): string[] => {
    const slugs: string[] = [];

    return slugs;
}

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

export type Component = {
    label: string;
    description: string;
    category: ComponentCategory;
    fileName: string;
    glob: unknown,
}