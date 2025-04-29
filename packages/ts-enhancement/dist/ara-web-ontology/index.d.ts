/**
 * Global Shared Data Types of Ara
 */
import { AraLink } from "../index.js";
export type AraComponentCategory = {
    name: string;
    slug: string;
    description: string;
};
export type AraComponent = {
    label: string;
    description: string;
    category: AraComponentCategory;
    modulePath: string;
    glob: unknown;
};
export type AraExpression = AraComponent & {
    prefix: string;
    elements: AraIdentifiedComponent[];
    suffix: string;
};
/**
 * What kind of component it is?
 */
export declare enum AraComponentIdentity {
    Rpc = "rpc",// RPCs are identified by the imported components
    Layout = "layout",// The page layout
    Component = "component",// Component
    Expression = "expression",// Expression
    Undeclared = "undeclared"
}
export type AraComponentData = AraComponent | AraRpcCallType | AraExpression;
export type AraIdentifiedComponent = {
    data: AraComponentData | AraLink<any>;
    id: AraComponentIdentity;
};
/**
 * ColumnSlug defines the types of Columns in the page rows
 */
export declare enum AraLayoutColumnSlug {
    Left = "left",
    Center = "center",
    Right = "right"
}
/**
 * RowSlug defines the types of the Rows in the page layout
 */
export declare enum AraLayoutRowSlug {
    Header = "header",
    Content = "content",
    Footer = "footer"
}
/**
 * RowProps defines the row properties
 */
export type AraLayoutRowProps = {
    rowClass?: string;
    columnClasses?: {
        [key in AraLayoutColumnSlug]?: string;
    };
    fix?: {
        [key in AraLayoutRowSlug]?: boolean;
    };
};
export type AraLayoutSlugs = {
    row?: AraLayoutRowSlug;
    column: AraLayoutColumnSlug;
};
/**
 * LayoutProps defines the each row property for the web page
 */
export type AraLayoutProps = {
    [key in AraLayoutRowSlug]?: AraLayoutRowProps;
};
export declare enum AraRpcType {
    Extension = "extension",
    Independent = "independent",
    Proxy = "proxy"
}
export type AraExtensionType = {
    name?: string;
    description?: string;
    pageUrl?: string;
    inputs?: any[];
    slug: string;
    rpcType?: AraRpcType.Extension;
    componentFilePath?: string;
};
export type AraRpcCallType = {
    slug: string;
    rpcType: AraRpcType;
    inputs: any[];
    outputs?: any[];
};
export type AraInputDescriptions = {
    inputDescriptions: {
        type: string;
        description: string;
    }[];
};
export type AraRPC = (AraExtensionType & AraInputDescriptions);
/**
 * A web page as a JSON-AD object
 */
export type AraPage = {
    title: string;
    description: string;
    fileName: string;
    components?: {
        [key in AraLayoutRowSlug]?: {
            [key in AraLayoutColumnSlug]?: (AraIdentifiedComponent)[];
        };
    };
    metaComponents?: (AraIdentifiedComponent)[];
    rpcs?: {
        [key in AraRpcType]?: AraRpcCallType[];
    };
    glob: unknown;
};
