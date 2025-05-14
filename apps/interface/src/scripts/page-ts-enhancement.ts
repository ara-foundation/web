import { AraLayoutColumnSlug, AraLayoutRowSlug } from "./ara-web-ontology/ara-web-ontology.js";

/**
 * Converts the Row and Column to the full slug of the page layout slug
 * @param row Row
 * @param column Column
 * @returns {string} is the path
 */
export const slugsToLayoutPath = (row: AraLayoutRowSlug, column: AraLayoutColumnSlug): string => {
    return `${row}-${column}`
}

export const contentLeftPath = slugsToLayoutPath(AraLayoutRowSlug.Content, AraLayoutColumnSlug.Left);
export const contentRightPath = slugsToLayoutPath(AraLayoutRowSlug.Content, AraLayoutColumnSlug.Right);
