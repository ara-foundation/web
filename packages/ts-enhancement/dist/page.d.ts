import { AraLayoutColumnSlug, AraLayoutRowSlug } from "#ontology";
/**
 * Converts the Row and Column to the full slug of the page layout slug
 * @param row Row
 * @param column Column
 * @returns {string} is the path
 */
export declare const slugsToLayoutPath: (row: AraLayoutRowSlug, column: AraLayoutColumnSlug) => string;
export declare const contentLeftPath: string;
export declare const contentRightPath: string;
