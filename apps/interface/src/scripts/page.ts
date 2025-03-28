import { parse, transform } from "@astrojs/compiler";
import type { ComponentNode, ElementNode, RootNode } from "@astrojs/compiler/types";
import { readFile } from "node:fs/promises"
import { parse as commentParse} from "comment-parser";
import type { RpcType } from "@scripts/rpc";

/**
 * RowSlug defines the types of the Rows in the page layout
 */
export enum RowSlug {
    Header = "header",
    Content = "content",
    Footer = "footer",
}
/**
 * ColumnSlug defines the types of Columns in the page rows
 */
export enum ColumnSlug {
    Left = "left",
    Center = "center",
    Right = "right",
}

/**
 * RowProps defines the row properties
 */
export type RowProps = {
    rowClass?: string;
    columnClasses?: {
        // Custom classes for the columns
        [key in ColumnSlug]?: string;
    },
    fix?: {
        // Fix The Row?
        [key in RowSlug]?: boolean;
    }
}

/**
 * A web page as a JSON-AD object
 */
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

/**
 * LayoutProps defines the each row property for the web page
 */
export type LayoutProps = {[key in RowSlug]?: RowProps}

/**
 * Converts the Row and Column to the full slug of the page layout slug
 * @param row Row
 * @param column Column
 * @returns {string} is the path
 */
export const layoutPath = (row: RowSlug, column: ColumnSlug): string => {
    return `${row}-${column}`
}

export const contentLeftPath = layoutPath(RowSlug.Content, ColumnSlug.Left);
export const contentRightPath = layoutPath(RowSlug.Content, ColumnSlug.Right);

export const getPages = async (): Promise<Page[]> => {
    // There are Markdown (.md extension) files that we won't count.
    // There are other pages that we won't count for now.
    const araPagesGlobs = import.meta.glob(`../pages/ara/**/*.astro`, { eager: true })

    return await pageGlobsToPages(araPagesGlobs);
}

/**
 * Returns a page by it's path
 */
export const getPageByUrl = async(url: string | undefined): Promise<Page|undefined> => {
    if (url === undefined) {
        return undefined;
    }
    if (url.length === 0) {
        return undefined;
    }
    if (url[url.length - 1] === "/") {
        url = url.substring(0, url.length - 1);
    }

    const pages = await getPages();

    for (const page of pages) {
        const pageUrl = fileNameToUrl(page.fileName);
        if (url === pageUrl) {
            return page;
        }
    }

    return undefined;
}

/**
 * Converts the file name into a Url within the Ara Web
 * @param fileName a page
 */
const fileNameToUrl = (fileName: string): string => {
    let index = fileName.indexOf("/index.astro");
    if (index > -1) {
        return fileName.substring(0, index)
    }

    return fileName.substring(0, fileName.indexOf(".astro"));
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

/**
 * Parses the Astro web page into the components and its frontmatter code.
 * 
 * Supports:
 *  - Component
 *  - Element types.
 * The pure text components in the web pages are not considered.
 * @todo make sure to parse the components to the respected areas
 * @param ast A RootNode of the Astro Web Page
 * @returns Components and Frontmatter
 */
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



/**
 *  @todo To identify the RPCs by components, use a special Typescript parser
 *  For now we rely on the component names
 * @param globs 
 * @returns 
 */
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

        const extracted = extractMeta(frontmatterCode, page);
        if (!extracted) {
            pages.push(page)
            continue;
        }
        

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

        pages.push(page);
        
    }

    return pages;
}


