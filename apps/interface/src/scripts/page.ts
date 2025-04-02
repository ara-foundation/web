import { parse, transform, type TransformResult } from "@astrojs/compiler";
import type { ComponentNode, ElementNode } from "@astrojs/compiler/types";
import { parse as commentParse} from "comment-parser";
import { RpcType, type RpcCallType } from "@scripts/rpc/types"
import { globsToFileContents, PathType, type FileContent, type NodeType } from "@scripts/reflect/fileLevel"
import { ComponentIdentity, Code } from "./reflect/codeLevel";


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

export type LayoutSlugs = {
    row?: RowSlug,
    column: ColumnSlug,
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
            [key in ColumnSlug]?: (NodeType)[]
        }
    };
    rpcs?: {
        [key in RpcType]?: RpcCallType[]
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
export const slugsToLayoutPath = (row: RowSlug, column: ColumnSlug): string => {
    return `${row}-${column}`
}

export const contentLeftPath = slugsToLayoutPath(RowSlug.Content, ColumnSlug.Left);
export const contentRightPath = slugsToLayoutPath(RowSlug.Content, ColumnSlug.Right);

export const getPages = async (): Promise<Page[]> => {
    const globs = import.meta.glob('../pages/ara/**/*.astro', {eager: true});
    const fileContents = await globsToFileContents(globs);
    return await fileContentsToPages(fileContents);
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
 * Validates the file content to be a page.
 * The pages are for example only .astro files that has frontmatter and at least a one component.
 * @param {FileContent} fileContent the parsed file
 * @returns {Page}
 */
const validatedFileContentToPage = (fileContent: FileContent): {page: Page, error: boolean} => {
    const page: Page = {
        title: "Warning: Undefined",
        description: "Not yet set",
        fileName: fileContent.filePath.substring(fileContent.filePath.lastIndexOf("/src/pages") + "/src/pages".length),
        glob: fileContent.glob,
    }

    if (fileContent.error !== undefined) {
        page.title = "Error: File Content Not Parsed",
        page.description = fileContent.error;
        return {page, error: true};
    }

    if (fileContent.type !== PathType.Astro) {
        page.title = "Warning: Unsupported page"
        page.description = "Only astro files should be in the pages"
        return {page, error: true};
    }
    if (fileContent.source === undefined) {
        page.title = "Error: Missing the scripting part of the page",
        page.description = "Missing the frontmatter in the page source code"
        return {page, error: true};
    }

    if (fileContent.nodes === undefined) {
        page.title = "Error: Missing any component"
        page.description = "Missing any component in the web page"
        return {page, error: true};
    }

    return {page, error: false};
}

/**
 * Detect's the Component's layout within the page.
 * If no component layout was given then it's considered to be at the default layout: content-center
 * @param node
 * @param {Code} astSource if attribute value is an expression, then find its value through traversing in the AST
 */
const detectComponentLayoutSlug = async (node: NodeType, astSource: Code): Promise<{error?: string, data?: LayoutSlugs}> => {
    const data: LayoutSlugs = {column: ColumnSlug.Center}
    const columnSlugs = Object.values(ColumnSlug).filter(value => typeof value === 'string') as string[];
    const rowSlugs = Object.values(RowSlug).filter(value => typeof value === 'string') as string[];

    const attr = astSource.attributeByName(node.attributes, "slot")
    if (attr === undefined) {
        data.row = RowSlug.Content;
        data.column = ColumnSlug.Center;
        return {
            data
        }
    }

    const slotAttr = await astSource.identifyAttribute<string>(attr);
    if (slotAttr.error) {
        return {
            error: `IdentifyAttributeError: ${slotAttr.error}`
        }
    }
    if (slotAttr.data === undefined || slotAttr.data.length === 0) {
        data.row = RowSlug.Content;
        data.column = ColumnSlug.Center;
        return {
            data
        }
    }

    let slugs: string[] = slotAttr.data.split("-");

    if (slugs.length === 1) {
        if (columnSlugs.indexOf(slugs[0]) > -1) {
            data.column = slugs[0] as ColumnSlug
        }
    } else if (slugs.length === 2) {
        if (columnSlugs.indexOf(slugs[1]) > -1) {
            data.column = slugs[1] as ColumnSlug
        
            if (rowSlugs.indexOf(slugs[0]) > -1) {
                data.row = slugs[0] as RowSlug
            }
        }
    }
    
    return {data};
}

/**
 * Add the component into the page at the layout
 * @param node The component to add
 * @param page The page itself
 * @param layoutSlugs The layout to pass the page
 * @returns {boolean} was it successful?
 */
const pushComponentAtLayoutSlugs = (node: NodeType, page: Page, layoutSlugs: LayoutSlugs): boolean => {
    if (page.components === undefined) {
        page.components = {};
    }

    if (layoutSlugs.row === undefined) {
        return false;
    }

    if (page.components[layoutSlugs.row!] === undefined) {
        page.components[layoutSlugs.row!] = {};
    }

    if (page.components[layoutSlugs.row!]![layoutSlugs.column] === undefined) {
        page.components[layoutSlugs.row]![layoutSlugs.column] = [];
    }

    page.components[layoutSlugs.row!]![layoutSlugs.column]?.push(node);

    return true;
}

const identifyLayoutComponents = async(layoutNode: NodeType, page: Page, code: Code): Promise<{error?: string, data?: Page}> => {
    let ret: {
        error?: string,
        data?: Page,
    } = {};

    for (const child of layoutNode.children) {
        if (child.type === "text") {
            continue;
        }
        if (child.type !== "component" && child.type !== "element") {
            return {
                error: `Layout Node ${layoutNode.name}'s component ${child.type} is not a component nor element`
            }
        }

        const {id: componentRole, data: componentData, error} = await code.identifyComponent(child)
        if (error !== undefined) {
            return {
                error: `identifyLayoutComponents(layoutNode=${layoutNode.name},page='${page.title}')/code.identifyComponent(child=${child.name}): ${error}`
            }
        }
        if (componentRole !== ComponentIdentity.Component) {
            return {
                error: `identifyLayoutComponents(layoutNode=${layoutNode.name},page='${page.title}')/code.identifyComponent(child=${child.name}): layouts could hold only nested components, not '${componentRole}' components`
            }
        }
        const layoutSlugs = await detectComponentLayoutSlug(child, code)
        if (layoutSlugs.error !== undefined) {
            return {
                error: `identifyLayoutComponents(layoutNode=${layoutNode.name},page=${page.title})/detectComponentLayoutSlug(child=${child.name}): ${layoutSlugs.error}`
            }
        }

        const pushed = pushComponentAtLayoutSlugs(componentData! as NodeType, page, layoutSlugs.data!);
        if (!pushed) {
            return {
                error: `identifyLayoutComponents(layoutNode=${layoutNode.name},page=${page.title})/pushComponentAtLayoutSlugs(componentData=${componentData!.name}): failed to push, no error`
            }
        } else {
            ret.data = page;
        }
    }

    return ret;
}

/**
 *  @todo To identify the RPCs by components, use a special Typescript parser
 *  For now we rely on the component names
 * @param globs 
 * @returns 
 */
const fileContentsToPages = async (fileContents: FileContent[]): Promise<Page[]> => {
    let pages: Page[] = [];

    let i = 0;

    for (let fileContent of fileContents) {
        if (++i === 2) {
            break;
        }
        let {page, error} = validatedFileContentToPage(fileContent); 
        if (error) {
            pages.push(page);
            continue;
        }
        
        if (!extractMeta(fileContent.source!, page)) {
            pages.push(page)
            continue;
        }

        if (page.rpcs === undefined) {
            page.rpcs = {};
        }
        if (page.components === undefined) {
            page.components = {};
        }

        const pageCode = new Code(fileContent.source!);

        for (let componentNode of fileContent.nodes!) {
            // Remove it here, as we add it within the layouts
            // All other components are added into meta objects
            const layoutSlugs = await detectComponentLayoutSlug(componentNode, pageCode);
            if (layoutSlugs.error !== undefined) {
                page.title = `Can't detect the component layout for ${componentNode.name}`
                page.description = `detectComponentLayoutSlug: ${layoutSlugs.error}`
                pages.push(page)
                continue;
            } else if (layoutSlugs.data === undefined) {
                page.title = `Stupid Medet, no error, no data?`
                page.description = `Ask him to debug it, 
                    and he will delegate to some intern that he doesn't like so that intern will be fired by himself`
                pages.push(page);
                continue;
            }
            
            const {id: componentRole, data: componentData, error} = await pageCode.identifyComponent(componentNode)
            if (error !== undefined) {
                page.title = `Error while identifying ${componentNode.name} component`
                page.description = error;
                pages.push(page);
                continue;
            }
            
            // Let's detect the ComponentType
            if (componentRole === ComponentIdentity.Undeclared) {
                page.title = `Undefined component '${componentNode.name}'`
                page.description = "The unsupported component"
                pages.push(page);
                continue;
            } else if (componentRole === ComponentIdentity.Component) {
                const pushed = pushComponentAtLayoutSlugs(componentData! as NodeType, page, layoutSlugs.data!);
                if (!pushed) {
                    page.title = "Undefined component path"
                    page.description = `Unable to determine the layout of ${(componentData! as NodeType).name} in the page`
                    pages.push(page);
                    continue;
                }
            } else if (componentRole === ComponentIdentity.Rpc) {
                if (page.rpcs === undefined) {
                    page.rpcs = {};
                }
                if ((componentData as RpcCallType).rpcType === RpcType.Extension) {
                    if (page.rpcs.extension === undefined) {
                        page.rpcs.extension = [];
                    }
                    page.rpcs.extension.push(componentData)
                } else if ((componentData as RpcCallType).rpcType === RpcType.Independent) {
                    if (page.rpcs.independent === undefined) {
                        page.rpcs.independent = [];
                    }
                    page.rpcs.independent.push(componentData)
                } else if ((componentData as RpcCallType).rpcType === RpcType.Proxy) {
                    if (page.rpcs.proxy === undefined) {
                        page.rpcs.proxy = [];
                    }
                    page.rpcs.proxy.push(componentData)
                }
                continue;
            } else if (componentRole === ComponentIdentity.Layout) {
                const layoutComponentsAdded = await identifyLayoutComponents(componentNode, page, pageCode);
                if (layoutComponentsAdded.error !== undefined) {
                    page.title = "Failed to identify layout components"
                    page.description = layoutComponentsAdded.error
                    pages.push(page);
                    continue;
                }
                page = layoutComponentsAdded.data!;
                pages.push(page);
                continue;
            } else {
                console.log(`Component ${componentNode.name} was not identified. It's neither Layout, nor Component nor RPC Call`);
            }
        }
    }

    return pages;
}
