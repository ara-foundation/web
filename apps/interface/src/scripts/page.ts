import { globsToFileContents, type FileContent } from "@scripts/reflect/fileLevel"
import { PageTraits } from "./reflect/araWebLevel";
import { type Page, RowSlug, ColumnSlug, type LayoutSlugs, type NodeType } from "@scripts/araWebOntology";

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
 *  @todo To identify the RPCs by components, use a special Typescript parser
 *  For now we rely on the component names
 * @param globs 
 * @returns 
 */
const fileContentsToPages = async (fileContents: FileContent[]): Promise<Page[]> => {
    let pages: Page[] = [];
    let i = 0;

    for (let fileContent of fileContents) {
        i++;
        // if (i < 1) {
        //     continue;
        // } else if (i == 2) {
        //     break;
        // }
        console.log(`File Content #${i} at ${fileContent.filePath} to page`)
        const pageTraitsResult = PageTraits.fromFileContent(fileContent!);
        if (pageTraitsResult.isFailure) {
            pages.push({
                title: `PageTraits.fromFileContent: ${pageTraitsResult.errorTitle}`,
                description: pageTraitsResult.errorDescription!,
                fileName: fileContent.filePath,
                glob: fileContent.glob,
            })
            continue;
        }

        const pageTraits: PageTraits = pageTraitsResult.getValue();
        const identificationResult = await pageTraits.identifyComponents();
        if (identificationResult.isFailure) {
            pages.push({
                title: `PageTraits.identifyComponents: ${identificationResult.errorTitle}`,
                description: identificationResult.errorDescription!,
                fileName: fileContent.filePath,
                glob: fileContent.glob,
            })
            continue;
        } else {
            pages.push(identificationResult.getValue())
        }
    }

    return pages;
}
