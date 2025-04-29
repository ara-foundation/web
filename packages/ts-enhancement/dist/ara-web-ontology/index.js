/**
 * Global Shared Data Types of Ara
 */
import { AraLink } from "../index.js";
/**
 * What kind of component it is?
 */
export var AraComponentIdentity;
(function (AraComponentIdentity) {
    AraComponentIdentity["Rpc"] = "rpc";
    AraComponentIdentity["Layout"] = "layout";
    AraComponentIdentity["Component"] = "component";
    AraComponentIdentity["Expression"] = "expression";
    AraComponentIdentity["Undeclared"] = "undeclared";
})(AraComponentIdentity || (AraComponentIdentity = {}));
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
export var AraLayoutColumnSlug;
(function (AraLayoutColumnSlug) {
    AraLayoutColumnSlug["Left"] = "left";
    AraLayoutColumnSlug["Center"] = "center";
    AraLayoutColumnSlug["Right"] = "right";
})(AraLayoutColumnSlug || (AraLayoutColumnSlug = {}));
/**
 * RowSlug defines the types of the Rows in the page layout
 */
export var AraLayoutRowSlug;
(function (AraLayoutRowSlug) {
    AraLayoutRowSlug["Header"] = "header";
    AraLayoutRowSlug["Content"] = "content";
    AraLayoutRowSlug["Footer"] = "footer";
})(AraLayoutRowSlug || (AraLayoutRowSlug = {}));
//////////////////////////////////////////////////////////////////////////////
//
// RPCs
//
//////////////////////////////////////////////////////////////////////////////
export var AraRpcType;
(function (AraRpcType) {
    AraRpcType["Extension"] = "extension";
    AraRpcType["Independent"] = "independent";
    AraRpcType["Proxy"] = "proxy";
})(AraRpcType || (AraRpcType = {}));
