/**
 * Get the meta data of the script from the comment.
 */
import { parse } from "comment-parser";
import type { Meta } from "../index.js";

export class Comment {
    /**
     * Extracts the Title, Description from the Page Meta.
     * Returns true if extraction was successful. Otherwise returns false and
     * the error message will be set in the page.title and page.description
     */
    public static getMetaFromComment = (source?: string): Meta => {
        const componentMeta: Meta = {
            title: "",
            description: "",
        }

        if (source === undefined) {
            return componentMeta;
        }

        const parsed = parse(source);
        if (parsed.length === 0) {
            return componentMeta;
        }
        
        for (const block of parsed) {
            componentMeta.title = block.description;
            
            for (const tag of block.tags) {
                if (tag.tag === "param") {
                    if (tag.type !== "string") {
                        continue;
                    }
                    
                    if (tag.name === "Title") {
                        if (tag.description.length > 0) {
                            componentMeta.title = tag.description;
                        }
                    } else if (tag.name === "Description") {
                        if (tag.description.length > 0) {
                            componentMeta.description = tag.description;
                        }
                    }
                }
            }
        }

        return componentMeta;
    }

}