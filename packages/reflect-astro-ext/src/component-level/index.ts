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
import { parse as commentParse} from "comment-parser";
import { 
    OkResult, 
    Result,
    Debug,
    ObjectTraits, 
    StringTraits
} from "@ara-web/ts-enhancement";
import { ModuleMemory, FilePath } from "@ara-web/reflect";
import { 
    FileExtension, 
    DEFAULT_SLOT, 
    ElementType, 
    type Component, 
    type Expression, 
    type Layout, 
    type Slots,
    type ModuleParts,
    type AstroNode,
    type OntologoicalIdentifier,
    ModuleCategory,
    AstroNodeTraits
} from "../index.js";

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
@ObjectTraits.staticImplements<OntologoicalIdentifier>()
export class ComponentLevel {
    /**
     * Converts the AstroNode (HTML elements such as Body, Head, Div etc) into a Component
     * @param {AstroNode} element 
     * @returns {Component}
     */
    public static identifyHTMLElement = (element: AstroNode): Component => {
        const component: Component = {
            title: `<${StringTraits.capitalizeFirstLetter(element.type)}>`,
            description: `The HTML Element`,
            glob: element,
            url: "",
            type: ElementType.Component,
            slots: {
                [DEFAULT_SLOT]: []
            }
        }

        return component;
    }

    public static identifyExpression = async (uiContent: ModuleParts, memory: ModuleMemory<unknown>, node: ExpressionNode): Promise<Result<Expression>> => {
        const elements: (Component|Expression)[] = [];
        let prefix: string|undefined = undefined;
        let suffix: string|undefined = undefined;
        
        for (let i = 0; i< node.children.length; i++) {
            const child = node.children[i];
            if (prefix === undefined) {
                if (child.type === "text") {
                    prefix = child.value.trim();
                    continue;
                }
            }
            if (suffix === undefined) {
                if (child.type === "text") {
                    suffix = child.value.trim();
                }
            }
            
            if (!AstroNodeTraits.isSupportedNode(child)) {
                console.log(`The expression has a child which is not supported by Ara Web yet:`);
                console.log(child);
                continue;
            }
            const content = await this.identifyAstroNode(uiContent, memory, child as AstroNode);
            if (content.isFailure) {
                return Result.fail(
                    `Invalid first element of expression:(component(i='${i}')='${node.children[1].type}'): ${content.errorTitle}`,
                    `Let the first element to be not something like comment or anything that is node NodeType: ${content.errorDescription}`,
                )
            }
            elements.push(content.getValue());
        }
        if (prefix === undefined) {
            if (elements.length === 0) {
                prefix = `Undefined syntax in the page, Ara Web doesn't support it`
            } else {
                prefix = elements[0].title
            }
        }
        if (suffix === undefined) {
            if (elements.length === 0) {
                suffix = `Undefined syntax in the page, Ara Web doesn't support it`
            } else if (elements.length > 1) {
                suffix = elements[elements.length-1].title
            } else {
                suffix = ``
            }
        }

        const expression: Expression = {
            type: ElementType.Expression,
            description: ``,
            url: memory.moduleLink.moduleURL,
            glob: node,
            title: `<Expression>`,
            prefix,
            suffix,
            slots: {
                [DEFAULT_SLOT]: elements,
            }
        }

        return Result.ok(expression);
    }

    private static validateModuleParts = (parts: ModuleParts): OkResult => {
        if (parts.fileExtension !== FileExtension.Astro) {
            return OkResult.fail("Unsupported page type", "Only .astro files should be in the pages")
        }
            
        if (parts.elements === undefined) {
            return OkResult.fail("Missing any component", "Please include the any component even if its empty");
        }
    
        return OkResult.ok();
    }
    
    /**
     * Converts the module into a component or layout
     * @param parts 
     * @param memory 
     * @returns 
     */
    public static identify = async<T>(parts: ModuleParts, rawMemory: ModuleMemory<T>): Promise<Result<T>> => {
        if (rawMemory.moduleCategory === ModuleCategory.Component) {
            const identified = await this._identifyComponent(parts, rawMemory as ModuleMemory<Component>);
            if (identified.isFailure) {
                return Result.fail(
                    `this._identifyComponent(): ${identified.errorTitle}`,
                    identified.errorDescription!
                )
            }
            return Result.ok(identified.getValue() as T)
        } else if (rawMemory.moduleCategory === ModuleCategory.Layout) {
            const identified = await this._identifyLayout(parts, rawMemory as ModuleMemory<Layout>);
            if (identified.isFailure) {
                return Result.fail(
                    `this._identifyLayout(): ${identified.errorTitle}`,
                    identified.errorDescription!
                )
            }
            return Result.ok(identified.getValue() as T)
        }
        return Result.errorCode404(['UI Level', 'Component Level'], 'identify', `The '${rawMemory.moduleCategory}' expected to be either '${ModuleCategory.Component}' or '${ModuleCategory.Layout}'`);
    }

    /**
     * Converts the module into a component
     * @param parts 
     * @param memory 
     * @returns 
     */
    public static _identifyComponent = async (parts: ModuleParts, memory: ModuleMemory<Component>): Promise<Result<Component>> => {
        const validated = this.validateModuleParts(parts);
        if (validated.isFailure) {
            return Result.fail(`this.validateParts(): ${validated.errorTitle}`, validated.errorDescription!)
        }
           
        const slots = await this.identifySlots<Component>(parts, memory);
        if (slots.isFailure) {
            return Result.fail(`this.identifySlots(): ${slots.errorTitle}`, slots.errorDescription);
        }
    
        const title = await FilePath.getFileName(memory.moduleLink.toFilePath);
        if (title.isFailure) {
            return Result.fail(`FilePath.getFileName('${memory.moduleLink.toFilePath}'): ${title.errorTitle}`, title.errorDescription!)
        }
        const description = this.getDescriptionFromComment(parts.source!);

        const component: Component = {
            title: title.getValue(), 
            description,
            url: memory.moduleLink.moduleURL,
            glob: memory.glob,
            slots: slots.getValue(),
            type: ElementType.Component,
        }
        
        return Result.ok(component);
    }

    /**
     * Extracts the Description from the Component Meta.
     * Returns an empty string if no comment.
    */
    private static getDescriptionFromComment = (source: string): string => {
        let description = '';
        const parsed = commentParse(source);
        if (parsed.length === 0) {
            return description;
        }
        
        for (let block of parsed) {
            description = block.description
            for (let tag of block.tags) {
                if (tag.tag === "param") {
                    if (tag.type !== "string") {
                        continue;
                    }
                        
                    if (tag.name === "Description") {
                        if (tag.description.length > 0) {
                            return tag.description;
                        }
                    }
                }
            }
        }
    
        return description;
    }
    

    /**
     * Identify each component within the page. All data of the page are represented as the components.
     * @returns {Result<AraPage>}
     */
    private static identifySlots = async <T>(uiContent: ModuleParts, memory: ModuleMemory<T>): Promise<Result<Slots>> => {
        const slots: Slots = {
            [DEFAULT_SLOT]: []
        };
            
        for (let componentNode of uiContent.elements!) {
            const identificationResult = await ComponentLevel.identifyAstroNode(uiContent, memory, componentNode)
            if (identificationResult.isFailure) {
                const err = Debug.error(
                    `ComponentLevel.identifyAstroNode(): ${identificationResult.errorTitle}`, 
                    identificationResult.errorDescription!,
                    componentNode,
                )    
                    
                return Result.fail(err)
            }
            
            slots[DEFAULT_SLOT].push(identificationResult.getValue())
        }
        return Result.ok(slots)
    }

    /**
     * Converts the AstroNode into the Component
     * @param element Node that we need to identify
     * @returns {IdentifiedComponent}
     */
    public static identifyAstroNode = async(uiContent: ModuleParts, memory: ModuleMemory<unknown>, element: AstroNode): Promise<Result<Component|Expression>> => {
        if (element.type === "element") {
            const component = this.identifyHTMLElement(element);
            component.url = memory.moduleLink.moduleURL
            return Result.ok(component)
        } else if (element.type === "expression") {
            const identificationResult = await this.identifyExpression(uiContent, memory, element as ExpressionNode)
            if (identificationResult.isFailure) {
                return Result.fail(
                    `this.identfyExpression: ${identificationResult.errorTitle}`,
                    identificationResult.errorDescription!
                )
            }
                
            return Result.ok(identificationResult.getValue())
        } else if (element.type === "component") {
            const identificationResult = await this.identifyAstroComponent(memory, element as ComponentNode)
            if (identificationResult.isFailure) {
                return Result.fail(
                    `this.identifyAstroComponent(): ${identificationResult.errorTitle}`,
                    identificationResult.errorDescription!
                )
            }
                
            return Result.ok(identificationResult.getValue())
        }

        return Result.errorCode501(['ComponentLevel'], 'identifyComponent');
    }

    public static identifyAstroComponent = async(memory: ModuleMemory<unknown>, element: ComponentNode): Promise<Result<Component>> => {
        const astNode = memory.identifierByName(element.name);
        if (astNode === undefined) {
            return Result.fail(
                `memory.identifierByName(identifier: '${element.name}'): not found`,
                'The element not found in the memory, perhaps its not defined yet nor imported?',
            )
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
        const componentData = this.astroNodeToComponent(element, astNode.data, astNode.importPath!.moduleURL!); 
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
    public static astroNodeToComponent = (node: ComponentNode, glob: unknown, filePath: string): Result<Component> => {
        const component: Component = {
            title: node.name,
            description: "",
            url: filePath,
            glob: glob,
            slots: {
                [DEFAULT_SLOT]: []
            },
            type: ElementType.Component
        }

        return Result.ok(component);
    }

    /**
     * Converts the module into layout 
     * The identified components are pushed into the page's layout.
     * Only the Components are supported, the nested layout or RPC calls inside the layout is prohibited.
     * @returns {Result<Page>}
     * @todo Include the nested components
    */
    private static _identifyLayout = async(parts: ModuleParts, memory: ModuleMemory<Layout>): Promise<Result<Layout>> => {
        const validated = this.validateModuleParts(parts);
        if (validated.isFailure) {
            return Result.fail(`this.validateParts(): ${validated.errorTitle}`, validated.errorDescription!)
        }
        
        // TODO in the identifySlots add the following
        // const layoutSlugsResult = await detectComponentLayoutSlug(page, uiContent, child)
        // if (layoutSlugsResult.isFailure) {
        //     return Result.fail(
        //         `this.detectComponentLayoutSlug(child=${componentName(child)}): ${layoutSlugsResult.errorTitle}`, 
        //         layoutSlugsResult.errorDescription!,
        //     )
        // }
        // pushComponentAtLayoutSlugs(page, identificationResult.getValue(), layoutSlugsResult.getValue());
        const slots = await this.identifySlots<Layout>(parts, memory);
        if (slots.isFailure) {
            return Result.fail(`this.identifySlots(): ${slots.errorTitle}`, slots.errorDescription);
        }
    
        const title = await FilePath.getFileName(memory.moduleLink.toFilePath);
        if (title.isFailure) {
            return Result.fail(`FilePath.getFileName('${memory.moduleLink.toFilePath}'): ${title.errorTitle}`, title.errorDescription!)
        }
        const description = this.getDescriptionFromComment(parts.source!);

        const layout: Layout = {
            title: title.getValue(), 
            description,
            url: memory.moduleLink.moduleURL,
            glob: memory.glob,
            slots: slots.getValue(),
            type: ElementType.Layout,
        }
        
        
        return Result.ok(layout);
    }

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
