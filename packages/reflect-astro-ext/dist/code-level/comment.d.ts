import type { Meta } from "../index.js";
export declare class Comment {
    /**
     * Extracts the Title, Description from the Page Meta.
     * Returns true if extraction was successful. Otherwise returns false and
     * the error message will be set in the page.title and page.description
     */
    static getMetaFromComment: (source?: string) => Meta;
}
