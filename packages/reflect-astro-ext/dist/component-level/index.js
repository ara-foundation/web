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
import { Result, ModuleLink, } from "@ara-web/ts-enhancement";
import { ModuleMemory } from "@ara-web/reflect";
import { ReflectLink } from "@ara-web/reflect/code-level";
import { DEFAULT_SLOT, AstroNode } from "../index.js";
import { AttributeLevel } from "./attribute-level.js";
// // TODO move to the app/interface/reflect to understand the RPCs
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
// import { AraLink } from "@ara-web/ts-enhancement/ara-link";
// import type { ModuleMemory } from "@ara-web/reflect/memory";
// import type { AstroNode } from "../component.js";
//////////////////////////////////////////////////////////////////////////////////
//
// Component specific methods
//
//////////////////////////////////////////////////////////////////////////////////
// /**
//  * If the component is RPC Call, then find out its data by checking the script
//  * @param componentNode Component parameter
//  * @param astSource If the RPC Call is not a string literal but an expression that is defined in the script, then find 
//  * its value from traversing in the AST
//  * @returns {RpcCallType|AraLink<Expression code string>}
//  */
// const identifyRpcCallComponent = async (page: Page, uiContent: UiContent, componentNode: AstroNode): Promise<Result<RpcCallType|AraLink<string>>> => {
//     const attrName = "rpcCall";
//     const attr = attributeByName(componentNode, attrName);
//     if (attr === undefined) {
//         return Result.fail(
//             `this.attributeByName(componentNode=(${JSON.stringify(componentNode)}), attrName='${attrName}')`,
//             `Attribute not found`
//         )
//     }
//     // Get the RPC Call value
//     const data = await identifyAttribute<RpcCallType>(uiContent, attr);
//     if (data.isFailure) {
//         return Result.fail(
//            `identifyAttribute(attr=${attr.name}): ${data.errorTitle}`,
//            data.errorDescription!
//         )
//     }
//     return Result.errorCode501(["UI Level", "Element Level"], "identifyRpcCallComponent")
//     // return Result.ok(data.getValue());
// }
/**
 * Ontologically, `ComponentLevel` supports translation of modules into `Component` and `Layout` data
 */
export class ComponentLevel {
    /**
     * Converts the AstroNode (HTML elements such as Body, Head, Div etc) into a Component
     * @param {AstroNode} element
     * @returns {Component}
     */
    static identifyHTMLElement = async (moduleParts, memory, element) => {
        const attributes = AttributeLevel.getNodeAttributes(element);
        if (attributes.isFailure) {
            return Result.fail(`AttributeLevel.getNodeAttributes(): ${attributes.errorTitle}`, attributes.errorDescription);
        }
        const component = {
            get: element,
            url: "",
            slots: {
                [DEFAULT_SLOT]: []
            },
            attributes: attributes.getValue(),
            class: ModuleLink.newPackageURL("www", "html", undefined, element.name)
        };
        const slots = await this.identifyChildren(moduleParts, memory, element);
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
    static identifyText = (element) => {
        const text = {
            get: element,
            url: "",
            value: element.value
        };
        return text;
    };
    static identifyChildren = async (moduleParts, memory, element) => {
        const slots = {
            [DEFAULT_SLOT]: []
        };
        if (element.children.length === 0) {
            return Result.ok(slots);
        }
        for (let child of element.children) {
            const astNode = child;
            const identifiedChild = await this.identifyAstroNode(moduleParts, memory, astNode);
            if (identifiedChild.isFailure) {
                return Result.fail(`this.identifyAstroNode(): ${identifiedChild.errorTitle}`, identifiedChild.errorDescription);
            }
            slots[DEFAULT_SLOT].push(identifiedChild.getValue());
        }
        return Result.ok(slots);
    };
    static identifyExpression = async (uiContent, memory, node) => {
        const elements = [];
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
            const content = await this.identifyAstroNode(uiContent, memory, child);
            if (content.isFailure) {
                return Result.fail(`expressionChild(${i}/${node.children.length - 1}): this.identifyAstroNode(): ${content.errorTitle}`, content.errorDescription);
            }
            elements.push(content.getValue());
        }
        const expression = {
            url: memory.moduleLink.moduleURL,
            get: node,
            prefix,
            suffix,
            slots: { [DEFAULT_SLOT]: elements },
        };
        return Result.ok(expression);
    };
    /**
     * Converts the AstroNode into the Component
     * @param element Node that we need to identify
     * @returns {IdentifiedComponent}
     */
    static identifyAstroNode = async (uiContent, memory, element) => {
        if (element.isHTMLElement) {
            const component = await this.identifyHTMLElement(uiContent, memory, element);
            if (component.isFailure) {
                return Result.fail(`this.identifyHTMLElement() ${component.errorTitle}`, component.errorDescription);
            }
            let val = component.getValue();
            val.url = memory.moduleLink.moduleURL;
            return Result.ok(val);
        }
        else if (element.isExpression) {
            const identificationResult = await this.identifyExpression(uiContent, memory, element);
            if (identificationResult.isFailure) {
                return Result.fail(`this.identfyExpression: ${identificationResult.errorTitle}`, identificationResult.errorDescription);
            }
            return Result.ok(identificationResult.getValue());
        }
        else if (element.isComponent) {
            const identificationResult = await this.identifyAstroComponent(uiContent, memory, element);
            if (identificationResult.isFailure) {
                return Result.fail(`this.identifyAstroComponent(): ${identificationResult.errorTitle}`, identificationResult.errorDescription);
            }
            return Result.ok(identificationResult.getValue());
        }
        else if (element.isText) {
            const identifiedText = this.identifyText(element);
            return Result.ok(identifiedText);
        }
        return Result.errorCode404(['ComponentLevel'], 'identifyComponent', `The element '${element.name}' is not supported`);
    };
    static identifyAstroComponent = async (moduleParts, memory, element) => {
        const astNode = memory.identifierByName(element.name);
        if (astNode === undefined) {
            return Result.fail(`memory.identifierByName(identifier: '${element.name}'): not found`, 'The element not found in the memory, perhaps its not defined yet nor imported?');
        }
        // Following is the part of the ara-web extension
        //
        // Component indicates an RPC Call?
        //
        // if (isRpcCallComponentLink(pathResult.importPath! as AraLink<string>)) {
        // const identificationResult = await identifyRpcCallComponent(page, uiContent, element);
        // if (identificationResult.isFailure) {
        //     return Result.fail(
        //         `this.identifyRpcCallComponent(componentNode='${element.name}'): ${identificationResult.errorTitle}`,
        //         identificationResult.errorDescription!,
        //     )
        // } else {
        //     return Result.ok({
        //         id: ComponentIdentity.Rpc,
        //         data: identificationResult.getValue()
        //     })
        // }
        // } else if (ComponentEngine.isLayoutModulePath(pathResult.importPath.resource as string)) {
        //     return Result.ok({
        //         id: ComponentIdentity.Layout,
        //         data: ComponentEngine.astroLayoutNodeToComponent(element, pathResult.importPath.toString())
        //     })
        // } else if (element.type === "component") {          
        const componentData = await this.astroNodeToComponent(moduleParts, memory, element, astNode.data, astNode.importPath.moduleURL);
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
    static astroNodeToComponent = async (moduleParts, memory, node, glob, filePath) => {
        const attributes = AttributeLevel.getNodeAttributes(node);
        if (attributes.isFailure) {
            return Result.fail(`AttributeLevel.getNodeAttributes(): ${attributes.errorTitle}`, attributes.errorDescription);
        }
        const identifyChildren = await this.identifyChildren(moduleParts, memory, node);
        if (identifyChildren.isFailure) {
            return Result.fail(`this.identifyChildren(): ${identifyChildren.errorTitle}`, identifyChildren.errorDescription);
        }
        const component = {
            url: filePath,
            get: glob,
            slots: identifyChildren.getValue(),
            attributes: attributes.getValue(),
            class: ReflectLink.linkToIdentifier(node.name, { absolutePath: filePath }).toModuleLink()
        };
        return Result.ok(component);
    };
}
//     /**
//      * Detect's the Component's layout within the page.
//      * If no component layout was given then it's considered to be at the default layout: content-center
//      * @param node
//      */
// const detectComponentLayoutSlug = async (page: Page, uiContent: UiContent, node: AstroNode): Promise<Result<LayoutSlugs>> => {
//         const data: LayoutSlugs = {column: ColumnSlug.Center}
//         const columnSlugs = Object.values(ColumnSlug).filter(value => typeof value === 'string') as string[];
//         const rowSlugs = Object.values(RowSlug).filter(value => typeof value === 'string') as string[];
//         const attr = attributeByName(node, "slot")
//         if (attr === undefined) {
//             data.row = RowSlug.Content;
//             data.column = ColumnSlug.Center;
//             return Result.ok(data);
//         }
//         const slotAttr = await identifyAttribute<string>(uiContent, attr);
//         if (slotAttr.isFailure) {
//             return Result.fail(
//                 `this.identifyAttribute<string>(attr='${attr.name}'): ${slotAttr.errorTitle}`,
//                 slotAttr.errorDescription!,
//             )
//         }
//         const slotData = slotAttr.getValue();
//         if (slotData === undefined || (typeof slotData === "string" && slotData.length === 0)) {
//             data.row = RowSlug.Content;
//             data.column = ColumnSlug.Center;
//             return Result.ok(data)
//         } else if (slotData instanceof AraLink) {
//             return Result.fail(
//                 `Slot Data is not a string`,
//                 `Ara Web supports string slot data for now only`
//             )
//         }
//         let slugs: string[] = slotData.split("-");
//         if (slugs.length === 1) {
//             if (columnSlugs.indexOf(slugs[0]) > -1) {
//                 data.column = slugs[0] as ColumnSlug
//             }
//         } else if (slugs.length === 2) {
//             if (columnSlugs.indexOf(slugs[1]) > -1) {
//                 data.column = slugs[1] as ColumnSlug
//                 if (rowSlugs.indexOf(slugs[0]) > -1) {
//                     data.row = slugs[0] as RowSlug
//                 }
//             }
//         }
//         return Result.ok(data);
//     }
//     /**
//      * Add the component into the page at the layout
//      * @param node The component to add
//      * @param layoutSlugs The layout to pass the page
//      */
//     const pushComponentAtLayoutSlugs = (page: Page, node: IdentifiedComponent, layoutSlugs: LayoutSlugs) => {
//         if (page.components === undefined) {
//             page.components = {};
//         }
//         if (page.components[layoutSlugs.row!] === undefined) {
//             page.components[layoutSlugs.row!] = {};
//         }
//         if (page.components[layoutSlugs.row!]![layoutSlugs.column] === undefined) {
//             page.components[layoutSlugs.row!]![layoutSlugs.column] = [];
//         }
//         page.components[layoutSlugs.row!]![layoutSlugs.column]?.push(node);
//     }
