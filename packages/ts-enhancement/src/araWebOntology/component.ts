/**
 * Global Shared Data Types of Ara
 */
import { type RpcCallType } from "./rpc.js"

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

export type ComponentData = Component | RpcCallType | Expression
