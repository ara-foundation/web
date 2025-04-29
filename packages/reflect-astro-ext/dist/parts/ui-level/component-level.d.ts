/**
 * Ara Web Level Reflection that deals with the Astro Components and Astro Component Attributes
 * @description Parses the file contents to the pages.
 * @warning Any rule such as what kind of Globs are considered as web pages
 * and how to convert them into the web files is called here.
 *
 * From the upper class receives the PageTraits.
 *
 * Low Level Internal level that depends on the Page:
 *  - Components
 *  - RPCs
 *  - Layouts
 */
import type { ComponentNode, ExpressionNode } from "@astrojs/compiler/types";
import { Result } from "@ara-web/ts-enhancement/result";
import type { ModuleMemory } from "@ara-web/reflect/memory";
import { type Component, type Expression, type ModuleParts, type AstroNode } from "#ontology";
/**
 * Ontologically, `ComponentLevel` supports translation of modules into `Component` and `Layout` data
 */
export declare class ComponentLevel {
    /**
     * Converts the AstroNode (HTML elements such as Body, Head, Div etc) into a Component
     * @param {AstroNode} element
     * @returns {Component}
     */
    static identifyHTMLElement: (element: AstroNode) => Component;
    static identifyExpression: (uiContent: ModuleParts, memory: ModuleMemory<unknown>, node: ExpressionNode) => Promise<Result<Expression>>;
    private static validateModuleParts;
    /**
     * Converts the module into a component or layout
     * @param parts
     * @param memory
     * @returns
     */
    static identify: <T>(parts: ModuleParts, rawMemory: ModuleMemory<T>) => Promise<Result<T>>;
    /**
     * Converts the module into a component
     * @param parts
     * @param memory
     * @returns
     */
    static _identifyComponent: (parts: ModuleParts, memory: ModuleMemory<Component>) => Promise<Result<Component>>;
    /**
     * Extracts the Description from the Component Meta.
     * Returns an empty string if no comment.
    */
    private static getDescriptionFromComment;
    /**
     * Identify each component within the page. All data of the page are represented as the components.
     * @returns {Result<AraPage>}
     */
    private static identifySlots;
    /**
     * Converts the AstroNode into the Component
     * @param element Node that we need to identify
     * @returns {IdentifiedComponent}
     */
    static identifyAstroNode: (uiContent: ModuleParts, memory: ModuleMemory<unknown>, element: AstroNode) => Promise<Result<Component | Expression>>;
    static identifyAstroComponent: (memory: ModuleMemory<unknown>, element: ComponentNode) => Promise<Result<Component>>;
    /**
     * Astro Framework's `ComponentNode` converted into ontological `Component`
     * @param node
     * @param glob
     * @param filePath
     * @returns
     */
    static astroNodeToComponent: (node: ComponentNode, glob: unknown, filePath: string) => Result<Component>;
    /**
     * Converts the module into layout
     * The identified components are pushed into the page's layout.
     * Only the Components are supported, the nested layout or RPC calls inside the layout is prohibited.
     * @returns {Result<Page>}
     * @todo Include the nested components
    */
    private static _identifyLayout;
}
