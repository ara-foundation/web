//////////////////////////////////////////////////////////////////////////////
//
// Slugs and Navigation Property:
// - Column
// - Row
// - Layout
//
//////////////////////////////////////////////////////////////////////////////

/**
 * ColumnSlug defines the types of Columns in the page rows
 */
export enum ColumnSlug {
    Left = "left",
    Center = "center",
    Right = "right",
}

/**
 * RowSlug defines the types of the Rows in the page layout
 */
export enum RowSlug {
    Header = "header",
    Content = "content",
    Footer = "footer",
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


