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
import { Result } from "@ara-web/p-hintjens";
import { ModuleMemory } from "@ara-web/reflect";
import { type Component, type Expression, type ModuleParts, AstroNode, type Text, type Slots } from "../index.js";
/**
 * Ontologically, `ComponentLevel` supports translation of modules into `Component` and `Layout` data
 */
export declare class ComponentLevel {
    /**
     * Converts the AstroNode (HTML elements such as Body, Head, Div etc) into a Component
     * @param {AstroNode} element
     * @returns {Component}
     */
    static identifyHTMLElement: (moduleParts: ModuleParts, memory: ModuleMemory<unknown>, element: AstroNode) => Promise<Result<Component>>;
    /**
 * Converts the AstroNode (HTML elements such as Body, Head, Div etc) into a Component
 * @param {AstroNode} element
 * @returns {Component}
 */
    static identifyText: (element: AstroNode) => Text;
    static identifyChildren: (moduleParts: ModuleParts, memory: ModuleMemory<unknown>, element: AstroNode) => Promise<Result<Slots>>;
    static identifyExpression: (uiContent: ModuleParts, memory: ModuleMemory<unknown>, node: AstroNode) => Promise<Result<Expression>>;
    /**
     * Converts the AstroNode into the Component
     * @param element Node that we need to identify
     * @returns {IdentifiedComponent}
     */
    static identifyAstroNode: (uiContent: ModuleParts, memory: ModuleMemory<unknown>, element: AstroNode) => Promise<Result<Component | Expression | Text>>;
    static identifyAstroComponent: (moduleParts: ModuleParts, memory: ModuleMemory<unknown>, element: AstroNode) => Promise<Result<Component>>;
    /**
     * Astro Framework's `ComponentNode` converted into ontological `Component`
     * @param node
     * @param glob
     * @param filePath
     * @returns
     */
    static astroNodeToComponent: (moduleParts: ModuleParts, memory: ModuleMemory<unknown>, node: AstroNode, glob: unknown, filePath: string) => Promise<Result<Component>>;
}
