/**
 * Global Shared Data Types of Ara
 * @todo make sure to not use the data types from @scripts/reflect/fileLevel
 */
import type { ElementNode, ExpressionNode, ComponentNode as AstroComponentNode } from "@astrojs/compiler/types";
import { RpcType, type RpcCallType } from "@scripts/rpc/types"


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

//////////////////////////////////////////////////////////////////////////////
//
// Component
//
//////////////////////////////////////////////////////////////////////////////
export type ComponentCategory = {
    name: string;
    slug: string;
    description: string;
}

export type Component = {
    label: string;
    description: string;
    category: ComponentCategory;
    fileName: string;
    glob: unknown,
}

export type Expression =  Component & {
    prefix: string;
    elements: IdentifiedComponent[];
    suffix: string;
}

/**
 * What kind of component it is?
 */
export enum ComponentIdentity {
    Rpc = "rpc",                    // RPCs are identified by the imported components
    Layout = "layout",              // The page layout
    Component = "component",        // Component
    Expression = "expression",      // Expression
    Undeclared = "undeclared",      // Unexpected
}

export type IdentifiedComponent = ComponentData & {
    id: ComponentIdentity,
}

export type ComponentNode = ElementNode | ExpressionNode | AstroComponentNode

export type ComponentData = Component | RpcCallType | Expression

//////////////////////////////////////////////////////////////////////////////
//
// Page
//
//////////////////////////////////////////////////////////////////////////////

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
            [key in ColumnSlug]?: (IdentifiedComponent)[]
        }
    };
    metaComponents?: (IdentifiedComponent)[]
    rpcs?: {
        [key in RpcType]?: RpcCallType[]
    }
    glob: unknown;
}

