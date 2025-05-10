/**
 * Ara Web Level Reflection that deals with the web components in the modules and their attributes
 */
import { Result, ModuleLink, ObjectLink, } from "@ara-web/p-hintjens";
import { ModuleMemory } from "@ara-web/reflect";
import { ReflectLink } from "@ara-web/reflect/code-level";
import { DEFAULT_SLOT, AstroNode, ElementType } from "../index.js";
import { AttributeLevel } from "./attribute-level.js";
import { ProjectMemory } from "@ara-web/reflect";
const htmlPackageURL = ModuleLink.newPackageURL("www", "html");
var ComponentType;
(function (ComponentType) {
    ComponentType["Astro"] = "astro";
    ComponentType["Expression"] = "expression";
    ComponentType["Text"] = "text";
    ComponentType["HtmlElement"] = "htme";
})(ComponentType || (ComponentType = {}));
// // The pages traits adds to the Page the following:
// // -- RPCs and refer to RPC types
// // -- File Content
// // -- AST
// // -- Components
// // import { type RpcCallType, rpcBySlug, isRpcCallComponentLink } from "@ara-web/rpc-engine";
// import { type UiContent } from "./ui-content.js";
// // Make sure that we move the component
// // import { expressionCategory, type AstroNode, ComponentEngine } from "@ara-web/component-engine";
// import { attributeByName, identifyAttribute } from "./attribute-level.js";
// import { AraLink } from "@ara-web/p-hintjens/ara-link";
// import type { ModuleMemory } from "@ara-web/reflect/memory";
// import type { AstroNode } from "../component.js";
//////////////////////////////////////////////////////////////////////////////////
//
// Component specific methods
//
//////////////////////////////////////////////////////////////////////////////////
/**
 * Ontologically, `ComponentLevel` supports translation of modules into `Component` and `Layout` data
 */
export class ComponentLevel {
    /**
     * If attributes of a component has an expression, then evaluate them using `CodeLevel`.
     * @param component
     * @param memory
     * @param projectMemory
     * @returns
     */
    static async lintAttributes(component, memory, projectMemory) {
        if ("attributes" in component) {
            const lintedAttributes = await AttributeLevel.lintAttributes(component.attributes, memory, projectMemory);
            if (lintedAttributes.isFailure) {
                return Result.fail(`AttributeLevel.lintAttributes(): ${lintedAttributes.errorTitle}`, lintedAttributes.errorDescription);
            }
            component.attributes = lintedAttributes.getValue();
            if (component.attributes.id !== undefined &&
                (typeof component.attributes.id === "string") || (typeof component.attributes.id === "number")) {
                const idPutted = component.link.putId(component.attributes.id);
                if (!idPutted) {
                    return Result.fail(`component.link.putId(id='${component.attributes.id}'): failed to put`, `Perhaps somewhere earlier the id was already put`);
                }
            }
        }
        return Result.ok(component);
    }
    /**
     * In which layout's slot the component should be set in.
     * @param component
     * @returns
     */
    static identifySlotName = (component) => {
        if ("attributes" in component) {
            const slot = component.attributes.slot;
            if (slot !== undefined && typeof slot === "string") {
                return slot;
            }
        }
        return DEFAULT_SLOT;
    };
    /**
     * Converts the AstroNode (HTML elements such as Body, Head, Div etc) into a Component
     * @param {AstroNode} element
     * @returns {Component}
     */
    static identifyHTMLElement = async (moduleParts, memory, element, elementLink, projectMemory) => {
        const attributes = AttributeLevel.getNodeAttributes(element);
        if (attributes.isFailure) {
            return Result.fail(`AttributeLevel.getNodeAttributes(): ${attributes.errorTitle}`, attributes.errorDescription);
        }
        const component = {
            get: element,
            link: elementLink,
            slots: {},
            attributes: { ...attributes.getValue(), name: element.name },
            class: htmlPackageURL,
            type: ElementType.Component
        };
        const slots = await this.identifyChildren(moduleParts, memory, element, elementLink, projectMemory);
        if (slots.isFailure) {
            return Result.fail(`this.identifyChildren(): ${slots.errorTitle}`, slots.errorDescription);
        }
        component.slots = slots.getValue();
        return Result.ok(component);
    };
    /**
     * Converts the AstroNode (HTML elements such as Body, Head, Div etc) into a Component
     * @param {AstroNode} element
     * @returns {Component}
     */
    static identifyText = (element, elementLink) => {
        const text = {
            get: element,
            link: elementLink,
            value: element.value,
            type: ElementType.Text
        };
        return text;
    };
    /**
     * Converts the AstroNode (HTML elements such as Body, Head, Div etc) into a Component
     * @param {AstroNode} element
     * @returns {Component}
     */
    static identifyChildren = async (moduleParts, memory, element, elementLink, projectMemory) => {
        const slots = {};
        if (element.children.length === 0) {
            return Result.ok(slots);
        }
        for (const astNode of element.children) {
            if (astNode.isText && astNode.value.length === 0) {
                continue;
            }
            const identifiedChild = await this.identifyAstroNode(moduleParts, memory, astNode, elementLink, projectMemory);
            if (identifiedChild.isFailure) {
                return Result.fail(`this.identifyAstroNode(): ${identifiedChild.errorTitle}`, identifiedChild.errorDescription);
            }
            const linted = await ComponentLevel.lintAttributes(identifiedChild.getValue(), memory, projectMemory);
            if (linted.isFailure) {
                return Result.fail(`ComponentLevel.lintAttributes(): ${linted.errorTitle}`, linted.errorDescription);
            }
            const slot = this.identifySlotName(linted.getValue());
            if (slots[slot] === undefined) {
                slots[slot] = [];
            }
            slots[slot].push(linted.getValue());
        }
        return Result.ok(slots);
    };
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
    static identifyExpression = async (uiContent, memory, node, nodeLink, projectMemory) => {
        const slots = {};
        let prefix = "Expression {";
        let suffix = "}";
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            if (prefix === undefined) {
                if (child.isText) {
                    prefix = child.value;
                    continue;
                }
            }
            if (suffix === undefined) {
                if (child.isText) {
                    suffix = child.value;
                }
            }
            const content = await this.identifyAstroNode(uiContent, memory, child, nodeLink, projectMemory);
            if (content.isFailure) {
                return Result.fail(`expressionChild(${i}/${node.children.length - 1}): this.identifyAstroNode(): ${content.errorTitle}`, content.errorDescription);
            }
            const linted = await this.lintAttributes(content.getValue(), memory, projectMemory);
            if (linted.isFailure) {
                return Result.fail(`expressionChild(${i}/${node.children.length - 1}): this.lintAttributes(): ${linted.errorTitle}`, linted.errorDescription);
            }
            const slot = this.identifySlotName(linted.getValue());
            if (slots[slot] === undefined) {
                slots[slot] = [];
            }
            slots[slot].push(linted.getValue());
        }
        const expression = {
            link: nodeLink,
            get: node,
            description: `${prefix} ${nodeLink.getId()} ${suffix} (Use AI to wrtie it)`,
            slots: slots,
            type: ElementType.Expression,
        };
        return Result.ok(expression);
    };
    /**
     * Converts the AstroNode into the Component
     * @param element Node that we need to identify
     * @returns {IdentifiedComponent}
     */
    static identifyAstroNode = async (uiContent, memory, element, elementLink, projectMemory) => {
        if (element.isHTMLElement) {
            const htmlElementLink = elementLink.getTaggedChild(element.name, undefined, [ComponentType.HtmlElement]);
            const component = await this.identifyHTMLElement(uiContent, memory, element, htmlElementLink, projectMemory);
            if (component.isFailure) {
                return Result.fail(`this.identifyHTMLElement() ${component.errorTitle}`, component.errorDescription);
            }
            const val = component.getValue();
            return Result.ok(val);
        }
        else if (element.isExpression) {
            const expressionLink = elementLink.getEnumuratedChild(ComponentType.Expression);
            const identificationResult = await this.identifyExpression(uiContent, memory, element, expressionLink, projectMemory);
            if (identificationResult.isFailure) {
                return Result.fail(`this.identfyExpression: ${identificationResult.errorTitle}`, identificationResult.errorDescription);
            }
            return Result.ok(identificationResult.getValue());
        }
        else if (element.isComponent) {
            const componentLink = elementLink.getTaggedChild(element.name, undefined, [ComponentType.Astro]);
            const identificationResult = await this.identifyAstroComponent(uiContent, memory, element, componentLink, projectMemory);
            if (identificationResult.isFailure) {
                return Result.fail(`this.identifyAstroComponent(): ${identificationResult.errorTitle}`, identificationResult.errorDescription);
            }
            return Result.ok(identificationResult.getValue());
        }
        else if (element.isText) {
            const textLink = elementLink.getEnumuratedChild(ComponentType.Text);
            const identifiedText = this.identifyText(element, textLink);
            return Result.ok(identifiedText);
        }
        return Result.errorCode404(['ComponentLevel'], 'identifyComponent', `The element '${element.name}' is not supported`);
    };
    static identifyAstroComponent = async (moduleParts, memory, element, elementLink, projectMemory) => {
        const astNode = memory.identifierByName(element.name);
        if (astNode === undefined) {
            return Result.fail(`memory.identifierByName(identifier: '${element.name}'): not found`, 'The element not found in the memory, perhaps its not defined yet nor imported?');
        }
        const componentData = await this.astroNodeToComponent(moduleParts, memory, element, astNode.data, elementLink, projectMemory);
        if (componentData.isFailure) {
            return Result.fail(`astroNodeToComponent('${element.name}', '${memory.moduleLink.moduleURL}'): ${componentData.errorTitle}`, componentData.errorDescription);
        }
        return Result.ok(componentData.getValue());
        // }
    };
    /**
     * Astro Framework's `ComponentNode` converted into ontological `Component`
     * @param node
     * @param glob
     * @param filePath
     * @returns
     */
    static astroNodeToComponent = async (moduleParts, memory, node, glob, nodeLink, projectMemory) => {
        const attributes = AttributeLevel.getNodeAttributes(node);
        if (attributes.isFailure) {
            return Result.fail(`AttributeLevel.getNodeAttributes(): ${attributes.errorTitle}`, attributes.errorDescription);
        }
        const children = await this.identifyChildren(moduleParts, memory, node, nodeLink, projectMemory);
        if (children.isFailure) {
            return Result.fail(`this.identifyChildren(): ${children.errorTitle}`, children.errorDescription);
        }
        const component = {
            link: nodeLink,
            get: glob,
            slots: children.getValue(),
            attributes: attributes.getValue(),
            class: ReflectLink.linkToIdentifier(node.name, { caller: nodeLink }).toModuleLink(),
            type: ElementType.Component
        };
        return Result.ok(component);
    };
}
