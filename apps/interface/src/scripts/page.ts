import { globsToPages } from "@ara-web/reflect"
import { type Page, RowSlug, ColumnSlug, Result } from "@ara-web/ts-enhancement";

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

export const getPages = async (): Promise<Result<Page[]>> => {
    const globs = import.meta.glob('../pages/ara/**/*.astro', {eager: true});
    return await globsToPages(globs);
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

    if (pages.isFailure) {
        return undefined;
    }

    for (const page of pages.getValue()) {
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

