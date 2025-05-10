/**
 * Ara Web Level Reflection that deals with the web components in the modules and their attributes
 */
import { Result, ObjectLink } from "@ara-web/p-hintjens";
import { ModuleMemory } from "@ara-web/reflect";
import { type Component, type Expression, type ModuleParts, AstroNode, type Text, type Slots, type SlotElement } from "../index.js";
import { ProjectMemory } from "@ara-web/reflect";
/**
 * Ontologically, `ComponentLevel` supports translation of modules into `Component` and `Layout` data
 */
export declare class ComponentLevel {
    /**
     * If attributes of a component has an expression, then evaluate them using `CodeLevel`.
     * @param component
     * @param memory
     * @param projectMemory
     * @returns
     */
    static lintAttributes(component: SlotElement, memory: ModuleMemory<unknown>, projectMemory: ProjectMemory): Promise<Result<SlotElement>>;
    /**
     * In which layout's slot the component should be set in.
     * @param component
     * @returns
     */
    static identifySlotName: (component: SlotElement) => string;
    /**
     * Converts the AstroNode (HTML elements such as Body, Head, Div etc) into a Component
     * @param {AstroNode} element
     * @returns {Component}
     */
    static identifyHTMLElement: (moduleParts: ModuleParts, memory: ModuleMemory<unknown>, element: AstroNode, elementLink: ObjectLink, projectMemory: ProjectMemory) => Promise<Result<Component>>;
    /**
     * Converts the AstroNode (HTML elements such as Body, Head, Div etc) into a Component
     * @param {AstroNode} element
     * @returns {Component}
     */
    static identifyText: (element: AstroNode, elementLink: ObjectLink) => Text;
    /**
     * Converts the AstroNode (HTML elements such as Body, Head, Div etc) into a Component
     * @param {AstroNode} element
     * @returns {Component}
     */
    static identifyChildren: (moduleParts: ModuleParts, memory: ModuleMemory<unknown>, element: AstroNode, elementLink: ObjectLink, projectMemory: ProjectMemory) => Promise<Result<Slots>>;
    /**
     * Identifies an expression from an AstroNode by processing its children nodes.
     *
     * It collects the expression parts using a defined prefix ("Expression {") and suffix ("}"),
     * then recursively processes each child node to form the complete expression.
     *
     * @param {ModuleParts} uiContent - The module parts containing UI information.
     * @param {ModuleMemory<unknown>} memory - The module memory instance containing module metadata.
     * @param {AstroNode} node - The AstroNode representing the expression.
     * @returns {Promise<Result<Expression>>} A Promise that resolves to a Result object containing
     *                                           the identified Expression or an error if identification fails.
     */
    static identifyExpression: (uiContent: ModuleParts, memory: ModuleMemory<unknown>, node: AstroNode, nodeLink: ObjectLink, projectMemory: ProjectMemory) => Promise<Result<Expression>>;
    /**
     * Converts the AstroNode into the Component
     * @param element Node that we need to identify
     * @returns {IdentifiedComponent}
     */
    static identifyAstroNode: (uiContent: ModuleParts, memory: ModuleMemory<unknown>, element: AstroNode, elementLink: ObjectLink, projectMemory: ProjectMemory) => Promise<Result<SlotElement>>;
    static identifyAstroComponent: (moduleParts: ModuleParts, memory: ModuleMemory<unknown>, element: AstroNode, elementLink: ObjectLink, projectMemory: ProjectMemory) => Promise<Result<Component>>;
    /**
     * Astro Framework's `ComponentNode` converted into ontological `Component`
     * @param node
     * @param glob
     * @param filePath
     * @returns
     */
    static astroNodeToComponent: (moduleParts: ModuleParts, memory: ModuleMemory<unknown>, node: AstroNode, glob: unknown, nodeLink: ObjectLink, projectMemory: ProjectMemory) => Promise<Result<Component>>;
}
