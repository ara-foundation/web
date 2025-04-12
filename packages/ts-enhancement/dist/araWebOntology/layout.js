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
export var ColumnSlug;
(function (ColumnSlug) {
    ColumnSlug["Left"] = "left";
    ColumnSlug["Center"] = "center";
    ColumnSlug["Right"] = "right";
})(ColumnSlug || (ColumnSlug = {}));
/**
 * RowSlug defines the types of the Rows in the page layout
 */
export var RowSlug;
(function (RowSlug) {
    RowSlug["Header"] = "header";
    RowSlug["Content"] = "content";
    RowSlug["Footer"] = "footer";
})(RowSlug || (RowSlug = {}));
