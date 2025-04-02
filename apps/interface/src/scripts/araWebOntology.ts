/**
 * Global Shared Data Types of Ara
 * @todo make sure to not use the data types from @scripts/reflect/fileLevel
 */
import type { ComponentNode, ElementNode } from "@astrojs/compiler/types";
import { RpcType, type RpcCallType } from "@scripts/rpc/types"

export type NodeType = ComponentNode | ElementNode;

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
 * LayoutProps defines the each row property for the web page
 */
export type LayoutProps = {[key in RowSlug]?: RowProps}


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
    metaComponents?: (NodeType)[]
    rpcs?: {
        [key in RpcType]?: RpcCallType[]
    }
    glob: unknown;
}