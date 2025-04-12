/**
 * ColumnSlug defines the types of Columns in the page rows
 */
export declare enum ColumnSlug {
    Left = "left",
    Center = "center",
    Right = "right"
}
/**
 * RowSlug defines the types of the Rows in the page layout
 */
export declare enum RowSlug {
    Header = "header",
    Content = "content",
    Footer = "footer"
}
/**
 * RowProps defines the row properties
 */
export type RowProps = {
    rowClass?: string;
    columnClasses?: {
        [key in ColumnSlug]?: string;
    };
    fix?: {
        [key in RowSlug]?: boolean;
    };
};
export type LayoutSlugs = {
    row?: RowSlug;
    column: ColumnSlug;
};
/**
 * LayoutProps defines the each row property for the web page
 */
export type LayoutProps = {
    [key in RowSlug]?: RowProps;
};
