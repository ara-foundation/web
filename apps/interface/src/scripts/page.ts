import { parse } from "@astrojs/compiler";
import type { ComponentNode, ElementNode, RootNode } from "@astrojs/compiler/types";
import { readFile } from "node:fs/promises"
import * as ts from "typescript";
import { parse as commentParse} from "comment-parser";
import type { RpcType } from "./rpc";

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

export const getPages = async (): Promise<Page[]> => {
    // There are Markdown (.md extension) files that we won't count.
    // There are other pages that we won't count for now.
    const araPagesGlobs = import.meta.glob(`../pages/ara/**/*.astro`, { eager: true })

    return await pageGlobsToPages(araPagesGlobs);
}

/**
 * Extracts the Title, Description from the Page Meta.
 * Returns true if extraction was successful. Otherwise returns false and
 * the error message will be set in the page.title and page.description
 */
const extractMeta = (frontmatterCode: string, page: Page): boolean => {
    const parsed = commentParse(frontmatterCode);
    if (parsed.length === 0) {
        page.title = "Error: Invalid Comment",
        page.description = "The web page is missing any comment in the JSDoc format"
        return false;
    }

    let pageCommentFound = false;
    let pageTitleFound = false;
    let pageDescriptionFound = false;
    
    for (let block of parsed) {
        for (let tag of block.tags) {
            if (tag.tag === "this") {
                if (tag.name === "Page") {
                    pageCommentFound = true;
                }
            } else if (tag.tag === "param") {
                if (tag.type !== "string") {
                    continue;
                }
                if (tag.name === "Title") {
                    if (tag.description.length > 0) {
                        page.title = tag.description;
                        pageTitleFound = true;
                    }
                } else if (tag.name === "Description") {
                    if (tag.description.length > 0) {
                        page.description = tag.description;
                        pageDescriptionFound = true;
                    }
                }
            }
        }

        if (!pageCommentFound) {
            page.title = "Error: Invalid Comment Type";
            page.description = "Missing a '@type Page' in the page comment"
        } else if (!pageTitleFound) {
            page.title = "Error: Invalid Title"
            page.description = "Missing the '@param {string} Title {...}'";
        } else if (!pageDescriptionFound) {
            page.title = "Error: Invalid Description";
            page.description = "Missing the '@param {string} Description {...}' in the page comment"
        } 

        if (pageCommentFound && pageTitleFound && pageDescriptionFound) {
            return true;
        }
    }

    return false;
}

// TODO: make sure to parse the components to the respected areas
const extractComponents = (ast: RootNode): {componentNodes: (ComponentNode|ElementNode)[], frontmatterCode: string} => {
    const componentNodes: (ComponentNode|ElementNode)[] = [];
    let frontmatterCode: string = "";

    for (let i = 0; i < ast.children.length; i++) {
        const child = ast.children[i];
        if (child.type === "text") {
            continue;
        }

        if (child.type === "frontmatter") {
            frontmatterCode = child.value;
        }
        else if (child.type === "component") {
            componentNodes.push(child)
        } else if (child.type === "element") {
            componentNodes.push(child);
        } else {
            console.log(`The page has ${child.type} node`)
            console.log(`Its data:`)
            console.log(child)
        }
    }

    return {componentNodes, frontmatterCode};
}

const pageGlobsToPages = async (globs: Record<string, unknown>): Promise<Page[]> => {
    let pages: Page[] = [];

    for (let glob in globs) {
        const filePath = (globs[glob]).file as string;
        const astroSourceBuffer = await readFile(filePath);
        const astroSource = astroSourceBuffer.toString();

        const page: Page = {
            title: "Error: Undefined",
            description: "Not yet set",
            fileName: filePath.substring(filePath.lastIndexOf("/src/pages") + "/src/pages".length),
            glob: globs[glob],
        }
        
        const result = await parse(astroSource, {
            position: false, // defaults to `true`
        });


        const {frontmatterCode, componentNodes} = extractComponents(result.ast);

        if (frontmatterCode.length === 0) {
            page.title = "Error: Invalid Page",
            page.description = "Missing the frontmatter in the page source code"
            pages.push(page);
            continue;
        }

        if (componentNodes.length === 0) {
            page.title = "Error: Invalid Components"
            page.description = "Missing any component in the web page"
            pages.push(page);
            continue;
        } 
        
        // TODO To identify the RPCs by components, use a special Typescript parser
        // For now we rely on the component names
        if (page.rpcs === undefined) {
            page.rpcs = {};
        }
        if (page.components === undefined) {
            page.components = {};
        }
            
            for (let componentNode of componentNodes) {
                if (componentNode.name.indexOf("Extension") !== -1) {
                    if (page.rpcs.extension === undefined) {
                        page.rpcs.extension = [componentNode as ComponentNode]
                    } else {
                        page.rpcs.extension.push(componentNode as ComponentNode);
                    }
                } else if (componentNode.name.indexOf("Proxy") !== -1) {
                    if (page.rpcs.proxy === undefined) {
                        page.rpcs.proxy = [componentNode as ComponentNode]
                    } else {
                        page.rpcs.proxy.push(componentNode as ComponentNode);
                    }
                } else if (componentNode.name.indexOf("Independent") !== -1) {
                    if (page.rpcs.independent === undefined) {
                        page.rpcs.independent = [componentNode as ComponentNode]
                    } else {
                        page.rpcs.independent.push(componentNode as ComponentNode);
                    }
                } else {
                    // It's neither of the RPCs? Then for now let's just add them into the Main Slot
                    if (page.components.content === undefined) {
                        page.components.content = {};
                    }
                    if (page.components.content.center === undefined) {
                        page.components.content.center = [];
                    }
                    page.components.content.center.push(componentNode);
                }
        }

        console.log(`The web page file: ${filePath}`);
        console.log(`The script of the page (${frontmatterCode.length} characters length):`)
        console.log(frontmatterCode);
        console.log(`The page has ${componentNodes.length} components`)
        for (const child of componentNodes) {
            console.log(`Component Name = ${child.name}`)
            console.log(`Component Attributes:`)
            console.log(child.attributes)
        }

        extractMeta(frontmatterCode, page);
        pages.push(page);
        
    }

    return pages;
}


export type Page = {
    title: string;
    description: string;
    fileName: string;
    components?: {
        [key in RowSlug]?: {    // Rows
            // Columns
            [key in ColumnSlug]?: (ComponentNode|ElementNode)[]
        }
    };
    rpcs?: {
        [key in RpcType]?: ComponentNode[]
    }
    glob: unknown;
}