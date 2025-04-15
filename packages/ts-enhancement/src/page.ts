import { ColumnSlug, RowSlug } from "./araWebOntology/layout.js";

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
