import { ColumnSlug, RowSlug } from "./araWebOntology/layout.js";
/**
 * Converts the Row and Column to the full slug of the page layout slug
 * @param row Row
 * @param column Column
 * @returns {string} is the path
 */
export declare const slugsToLayoutPath: (row: RowSlug, column: ColumnSlug) => string;
export declare const contentLeftPath: string;
export declare const contentRightPath: string;
