/**
 * Global Shared Data Types of Ara
 */
import { AraLink } from "@ara-web/p-hintjens";

//////////////////////////////////////////////////////////////////////////////
//
// Component
//
//////////////////////////////////////////////////////////////////////////////
export type AraComponentCategory = {
    name: string;
    slug: string;
    description: string;
}

export type AraComponent = {
    label: string;
    description: string;
    category: AraComponentCategory;
    modulePath: string;
    glob: unknown,
}

export type AraExpression =  AraComponent & {
    prefix: string;
    elements: AraIdentifiedComponent[];
    suffix: string;
}

/**
 * What kind of component it is?
 */
export enum AraComponentIdentity {
    Rpc = "rpc",                    // RPCs are identified by the imported components
    Layout = "layout",              // The page layout
    Component = "component",        // Component
    Expression = "expression",      // Expression
    Undeclared = "undeclared",      // Unexpected
}

export type AraComponentData = AraComponent | AraRpcCallType | AraExpression

export type AraIdentifiedComponent = {
    data: AraComponentData|AraLink<any>
    id: AraComponentIdentity,
}


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
export enum AraLayoutColumnSlug {
    Left = "left",
    Center = "center",
    Right = "right",
}

/**
 * RowSlug defines the types of the Rows in the page layout
 */
export enum AraLayoutRowSlug {
    Header = "header",
    Content = "content",
    Footer = "footer",
}

/**
 * RowProps defines the row properties
 */
export type AraLayoutRowProps = {
    rowClass?: string;
    columnClasses?: {
        // Custom classes for the columns
        [key in AraLayoutColumnSlug]?: string;
    },
    fix?: {
        // Fix The Row?
        [key in AraLayoutRowSlug]?: boolean;
    }
}

export type AraLayoutSlugs = {
    row?: AraLayoutRowSlug,
    column: AraLayoutColumnSlug,
}

/**
 * LayoutProps defines the each row property for the web page
 */
export type AraLayoutProps = {[key in AraLayoutRowSlug]?: AraLayoutRowProps}

//////////////////////////////////////////////////////////////////////////////
//
// RPCs
//
//////////////////////////////////////////////////////////////////////////////


export enum AraRpcType {
    Extension = "extension",
    Independent = "independent",
    Proxy = "proxy"
}

export type AraExtensionType = {
    name?: string;  // for example redirect
    description?: string; // for example: Redirects to another page
    pageUrl?: string;   // The web page that called the extension
    inputs?: any[];
    slug: string;
    rpcType?: AraRpcType.Extension;
    componentFilePath?: string;
}

export type AraRpcCallType = {
    slug: string; // RPC Call
    rpcType: AraRpcType,
    inputs: any[],
    outputs?: any[],
}

export type AraInputDescriptions = {
    inputDescriptions: {
        type: string;   // Type of the Input
        description: string; // Explain the input
    }[]
};

export type AraRPC = (AraExtensionType & AraInputDescriptions)

//////////////////////////////////////////////////////////////////////////////
//
// Slugs and Navigation Property:
// - Column
// - Row
// - Layout
//
//////////////////////////////////////////////////////////////////////////////


/**
 * A web page as a JSON-AD object
 */
export type AraPage = {
    title: string;
    description: string;
    fileName: string;
    components?: {
        [key in AraLayoutRowSlug]?: {    // Rows
            // Columns
            [key in AraLayoutColumnSlug]?: (AraIdentifiedComponent)[]
        }
    };
    metaComponents?: (AraIdentifiedComponent)[]
    rpcs?: {
        [key in AraRpcType]?: AraRpcCallType[]
    }
    glob: unknown;
}

