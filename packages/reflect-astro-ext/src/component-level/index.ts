/**
 * Ara Web Level Reflection that deals with the web components in the modules and their attributes
 */
import { ModuleLink, ObjectLink } from "@ara-web/sds";
import { 
    Result
} from "@ara-web/p-hintjens";
import { ModuleMemory } from "@ara-web/reflect";
import { ReflectLink } from "@ara-web/reflect/code-level";
import { 
    DEFAULT_SLOT, 
    type Component, 
    type Expression, 
    type ModuleParts,
    AstroNode,
    type Text,
    type Slots,
    type SlotElement,
    ElementType
} from "../index.js";
import { AttributeLevel } from "./attribute-level.js";
import { ProjectMemory } from "@ara-web/reflect";

const htmlPackageURL = ModuleLink.newPackageURL("www", "html")
enum ComponentType {
    Astro = "astro",
    Expression = "expression",
    Text = "text",  // Raw value ;)
    HtmlElement = "htme",   // Hyper Text Markup Element
}

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
    public static async lintAttributes(component: SlotElement, memory: ModuleMemory<unknown>, projectMemory: ProjectMemory): Promise<Result<SlotElement>> {
        if ("attributes" in component) {
            const lintedAttributes = await AttributeLevel.lintAttributes(component.attributes, memory, projectMemory);
            if (lintedAttributes.isFailure) {
                return Result.fail(
                    `AttributeLevel.lintAttributes(): ${lintedAttributes.errorTitle}`,
                    lintedAttributes.errorDescription!
                )
            }
            component.attributes = lintedAttributes.getValue();
            if (component.attributes.id !== undefined && 
                (typeof component.attributes.id === "string") || (typeof component.attributes.id === "number")) {
                    const idPutted = component.link.putId(component.attributes.id! as string|number);
                    if (!idPutted) {
                        return Result.fail(
                            `component.link.putId(id='${component.attributes.id}'): failed to put`,
                            `Perhaps somewhere earlier the id was already put`
                        )
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
    public static identifySlotName = (component: SlotElement): string => {
        if ("attributes" in component) {
            const slot = component.attributes.slot;
            if (slot !== undefined && typeof slot === "string") {
                return slot;
            }
        }

        return DEFAULT_SLOT
    }

    /**
     * Converts the AstroNode (HTML elements such as Body, Head, Div etc) into a Component
     * @param {AstroNode} element 
     * @returns {Component}
     */
    public static identifyHTMLElement = async (moduleParts: ModuleParts, memory: ModuleMemory<unknown>, element: AstroNode, elementLink: ObjectLink, projectMemory: ProjectMemory): Promise<Result<Component>> => {
        const attributes = AttributeLevel.getNodeAttributes(element);
        if (attributes.isFailure) {
            return Result.fail(`AttributeLevel.getNodeAttributes(): ${attributes.errorTitle}`, attributes.errorDescription!);
        }

        const component: Component = {
            get: element,
            link: elementLink,
            slots: {},
            attributes: {...attributes.getValue(), name: element.name},
            componentClass: htmlPackageURL,
            type: ElementType.Component
        }

        
        const slots = await this.identifyChildren(moduleParts, memory, element, elementLink, projectMemory);
        if (slots.isFailure) {
            return Result.fail(
                `this.identifyChildren(): ${slots.errorTitle}`,
                slots.errorDescription!
            )
        }
        component.slots = slots.getValue();

        return Result.ok(component);
    }

    /**
     * Converts the AstroNode (HTML elements such as Body, Head, Div etc) into a Component
     * @param {AstroNode} element 
     * @returns {Component}
     */
    public static identifyText = (element: AstroNode, elementLink: ObjectLink): Text => {
        const text: Text = {
            get: element,
            link: elementLink,
            value: element.value,
            type: ElementType.Text
        }

        return text;
    }

    /**
     * Converts the AstroNode (HTML elements such as Body, Head, Div etc) into a Component
     * @param {AstroNode} element 
     * @returns {Component}
     */
    public static identifyChildren = async (moduleParts: ModuleParts, memory: ModuleMemory<unknown>, element: AstroNode, elementLink: ObjectLink, projectMemory: ProjectMemory): Promise<Result<Slots>> => {
        const slots: Slots = {}
        if (element.children.length === 0) {
            return Result.ok(slots);
        }
        for (const astNode of element.children) {
            if (astNode.isText && astNode.value.length === 0) {
                continue;
            }
            const identifiedChild = await this.identifyAstroNode(moduleParts, memory, astNode, elementLink, projectMemory);
            if (identifiedChild.isFailure) {
                return Result.fail(
                    `this.identifyAstroNode(): ${identifiedChild.errorTitle}`,
                    identifiedChild.errorDescription!
                )
            }

            
            const linted = await ComponentLevel.lintAttributes(identifiedChild.getValue(), memory, projectMemory);
            if (linted.isFailure) {
                return Result.fail(
                    `ComponentLevel.lintAttributes(): ${linted.errorTitle}`,
                    linted.errorDescription!
                )
            }

            const slot = this.identifySlotName(linted.getValue());
            if (slots[slot] === undefined) {
                slots[slot] = [];
            }
            slots[slot].push(linted.getValue())
        }

        return Result.ok(slots)
    }

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
    public static identifyExpression = async (uiContent: ModuleParts, memory: ModuleMemory<unknown>, node: AstroNode, nodeLink: ObjectLink, projectMemory: ProjectMemory): Promise<Result<Expression>> => {
        const slots: Slots = {};
        let prefix: string = "Expression {";
        let suffix: string = "}";

        for (let i = 0; i< node.children.length; i++) {
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
                return Result.fail(
                    `expressionChild(${i}/${node.children.length-1}): this.identifyAstroNode(): ${content.errorTitle}`,
                    content.errorDescription!,
                )
            }

            const linted = await this.lintAttributes(content.getValue(), memory, projectMemory);
            if (linted.isFailure) {
                return Result.fail(
                    `expressionChild(${i}/${node.children.length-1}): this.lintAttributes(): ${linted.errorTitle}`,
                    linted.errorDescription!
                )
            }
            const slot = this.identifySlotName(linted.getValue());
            if (slots[slot] === undefined) {
                slots[slot] = [];
            }
            slots[slot].push(linted.getValue());
        }

        const expression: Expression = {
            link: nodeLink,
            get: node,
            description: `${prefix} ${nodeLink.getId()} ${suffix} (Use AI to wrtie it)`,
            slots: slots,
            type: ElementType.Expression,
        }

        return Result.ok(expression);
    }


    /**
     * Converts the AstroNode into the Component
     * @param element Node that we need to identify
     * @returns {IdentifiedComponent}
     */
    public static identifyAstroNode = async(uiContent: ModuleParts, memory: ModuleMemory<unknown>, element: AstroNode, elementLink: ObjectLink, projectMemory: ProjectMemory): Promise<Result<SlotElement>> => {
        if (element.isHTMLElement) {
            const htmlElementLink = elementLink.getTaggedChild(element.name, undefined, [ComponentType.HtmlElement]);
            
            const component = await this.identifyHTMLElement(uiContent, memory, element, htmlElementLink, projectMemory);
            if (component.isFailure) {
                return Result.fail(`this.identifyHTMLElement() ${component.errorTitle}`, component.errorDescription!)
            }
            const val = component.getValue();
            return Result.ok(val)
        } else if (element.isExpression) {
            const expressionLink = elementLink.getEnumuratedChild(ComponentType.Expression);
            const identificationResult = await this.identifyExpression(uiContent, memory, element, expressionLink, projectMemory)
            if (identificationResult.isFailure) {
                return Result.fail(
                    `this.identfyExpression: ${identificationResult.errorTitle}`,
                    identificationResult.errorDescription!
                )
            }
                
            return Result.ok(identificationResult.getValue())
        } else if (element.isComponent) {
            const componentLink = elementLink.getTaggedChild(element.name, undefined, [ComponentType.Astro]);
            const identificationResult = await this.identifyAstroComponent(uiContent, memory, element, componentLink, projectMemory)
            if (identificationResult.isFailure) {
                return Result.fail(
                    `this.identifyAstroComponent(): ${identificationResult.errorTitle}`,
                    identificationResult.errorDescription!
                )
            }
                
            return Result.ok(identificationResult.getValue())
        } else if (element.isText) {
            const textLink = elementLink.getEnumuratedChild(ComponentType.Text);
            const identifiedText = this.identifyText(element, textLink);
            return Result.ok(identifiedText)
        }

        return Result.errorCode404(['ComponentLevel'], 'identifyComponent', `The element '${element.name}' is not supported`);
    }

    public static identifyAstroComponent = async(moduleParts: ModuleParts, memory: ModuleMemory<unknown>, element: AstroNode, elementLink: ObjectLink, projectMemory: ProjectMemory): Promise<Result<Component>> => {
        const astNode = memory.rest.get!(`#${element.name}`);
        if (astNode === null) {
            return Result.fail(
                `memory.identifierByName(identifier: '${element.name}'): not found`,
                'The element not found in the memory, perhaps its not defined yet nor imported?',
            )
        }

        const componentData = await this.astroNodeToComponent(moduleParts, memory, element, astNode.getElement()!.data, elementLink!, projectMemory); 
        if (componentData.isFailure) {
            return Result.fail(
                `astroNodeToComponent('${element.name}', '${memory.moduleLink.moduleURL}'): ${componentData.errorTitle}`,
                componentData.errorDescription!
            )
        }
        return Result.ok(componentData.getValue())
        // }
    }

    /**
     * Astro Framework's `ComponentNode` converted into ontological `Component`
     * @param node 
     * @param glob 
     * @param filePath 
     * @returns 
     */
    public static astroNodeToComponent = async (moduleParts: ModuleParts, memory: ModuleMemory<unknown>, node: AstroNode, glob: unknown, nodeLink: ObjectLink, projectMemory: ProjectMemory): Promise<Result<Component>> => {
        const attributes = AttributeLevel.getNodeAttributes(node);
        if (attributes.isFailure) {
            return Result.fail(`AttributeLevel.getNodeAttributes(): ${attributes.errorTitle}`, attributes.errorDescription!);
        }

        const children = await this.identifyChildren(moduleParts, memory, node, nodeLink, projectMemory);
        if (children.isFailure) {
            return Result.fail(`this.identifyChildren(): ${children.errorTitle}`, children.errorDescription!);
        }

        const component: Component = {
            link: nodeLink,
            get: glob,
            slots: children.getValue(),
            attributes: attributes.getValue(),
            componentClass: ReflectLink.linkToIdentifier(node.name, {caller: nodeLink}).toModuleLink(),
            type: ElementType.Component
        }

        return Result.ok(component);
    }
}
