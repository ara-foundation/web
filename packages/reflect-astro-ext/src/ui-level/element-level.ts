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
// import type { ExpressionNode, Node as AstroComponentNode } from "@astrojs/compiler/types";

// import { ColumnSlug, RowSlug, ComponentIdentity, Result } from "@ara-web/ts-enhancement";
// import type { LayoutSlugs, Expression, Page, IdentifiedComponent, Component } from "@ara-web/ts-enhancement";

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


// //////////////////////////////////////////////////////////////////////////////////
// //
// // Component specific methods
// //
// //////////////////////////////////////////////////////////////////////////////////

// export const componentName = (component: AstroNode|IdentifiedComponent): string => {
//     const identifiedComponent = (component as IdentifiedComponent);
//     if (identifiedComponent !== undefined) {
//         if (identifiedComponent.id === ComponentIdentity.Expression) {
//             return (identifiedComponent.data as Expression).label;
//         } else if (identifiedComponent.id === ComponentIdentity.Layout) {
//             return (identifiedComponent.data as Component).label
//         } else if (identifiedComponent.id === ComponentIdentity.Undeclared) {
//             return `Undeclared component`
//         } else if (identifiedComponent.id === ComponentIdentity.Rpc) {
//             const rpc = rpcBySlug((identifiedComponent.data as RpcCallType).slug)
//             return rpc === undefined ? (identifiedComponent.data as RpcCallType).slug : rpc.name!; 
//         } else if (identifiedComponent.id === ComponentIdentity.Component) {
//             return (identifiedComponent.data as Component).label;
//         }
//     }
    
//     component = component as AstroNode;

//     if (component.type === "expression") {
//         return `Expression with ${component.children[0].type}`
//     }
//     return component.name;
// }

// const isSupportedNode = (node: AstroComponentNode): boolean => {
//     return node.type === "component" || node.type === "element" || node.type === "expression"
// }

// const identifyExpression = async <T>(page: Page, uiContent: UiContent, memory: ModuleMemory<T>, expressionElement: ExpressionNode): Promise<Result<Expression>> => {
//     const elements: IdentifiedComponent[] = [];
//     let prefix: string|undefined = undefined;
//     let suffix: string|undefined = undefined;
//     for (let i = 0; i< expressionElement.children.length; i++) {
//         const child = expressionElement.children[i];
//         if (prefix === undefined) {
//             if (child.type === "text") {
//                 prefix = child.value.trim();
//                 continue;
//             }
//         }
//         if (suffix === undefined) {
//             if (child.type === "text") {
//                 suffix = child.value.trim();
//             }
//         }
        
//         if (!isSupportedNode(child)) {
//             console.log(`The expression has a child which is not supported by Ara Web yet:`);
//             console.log(child);
//             continue;
//         }
//         const content = await identifyComponent(page, uiContent, memory, child as AstroNode);
//         if (content.isFailure) {
//             return Result.fail(
//                 `Invalid first element of expression:(component(i='${i}')='${expressionElement.children[1].type}'): ${content.errorTitle}`,
//                 `Let the first element to be not something like comment or anything that is node NodeType: ${content.errorDescription}`,
//             )
//         }
//         elements.push(content.getValue());
//     }
//     if (prefix === undefined) {
//         if (elements.length === 0) {
//             prefix = `Undefined syntax in the page, Ara Web doesn't support it`
//         } else {
//             prefix = elements[0].id
//         }
//     }
//     if (suffix === undefined) {
//         if (elements.length === 0) {
//             suffix = `Undefined syntax in the page, Ara Web doesn't support it`
//         } else if (elements.length > 1) {
//             suffix = elements[elements.length-1].id
//         } else {
//             suffix = ``
//         }
//     }

//     const expression: Expression = {
//         category: expressionCategory,
//         description: ``,
//         modulePath: ``,
//         glob: expressionElement,

//         label: `<Expression>`,
//         prefix,
//         suffix,
//         elements: elements,
//     }

//     return Result.ok(expression);
// }

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


// /**
//  * Identifies what kind of component and it's value.
//  * @param element Node that we need to identify
//  * @returns {IdentifiedComponent}
//  */
// export const identifyComponent = async <T>(page: Page, uiContent: UiContent, memory: ModuleMemory<T>, element: AstroNode): Promise<Result<IdentifiedComponent>> => {
//     if (element.type === "element") {
//         const component = ComponentEngine.astroElementNodeToComponent(element);
//         return Result.ok({data: component, id: ComponentIdentity.Component})
//     } else if (element.type === "expression") {
//             const identificationResult = await identifyExpression(page, uiContent, memory, element as ExpressionNode)
//             if (identificationResult.isFailure) {
//                 return Result.fail(
//                     `expression componentNode: this.identfyExpression: ${identificationResult.errorTitle}`,
//                     identificationResult.errorDescription!
//                 )
//             }
            
//             return Result.ok({id: ComponentIdentity.Expression, data: identificationResult.getValue()})
//     } 

//     //Before identifying the components, identify the UIContent's imported identifiers.
//     // const pathResult = uiContent.code.identifyImportPath(element.name);
//     const pathResult = memory.identifierByName(element.name);
//     if (pathResult === undefined) {
//         return Result.fail(
//             `memory.identifierByName(identifier: '${element.name}'): not found`,
//             'The element not found in the memory, perhaps its not defined yet nor imported?',
//         )
//     }
//     if (pathResult.importPath === undefined) {
//         return Result.fail(
//             `The module found, but not imported`,
//             `Consider importing the file.`
//         )
//     }

//     /////////////////////////////////////////////////////////////////////////////////
//     //
//     // Component was loaded as the import declaration, identify the type
//     //
//     /////////////////////////////////////////////////////////////////////////////////
    
//     //
//     // Component indicates an RPC Call?
//     //
//     if (isRpcCallComponentLink(pathResult.importPath! as AraLink<string>)) {
//         const identificationResult = await identifyRpcCallComponent(page, uiContent, element);
//         if (identificationResult.isFailure) {
//             return Result.fail(
//                 `this.identifyRpcCallComponent(componentNode='${element.name}'): ${identificationResult.errorTitle}`,
//                 identificationResult.errorDescription!,
//             )
//         } else {
//             return Result.ok({
//                 id: ComponentIdentity.Rpc,
//                 data: identificationResult.getValue()
//             })
//         }
//     } else if (ComponentEngine.isLayoutModulePath(pathResult.importPath.resource as string)) {
//         return Result.ok({
//             id: ComponentIdentity.Layout,
//             data: ComponentEngine.astroLayoutNodeToComponent(element, pathResult.importPath.toString())
//         })
//     } else if (element.type === "component") {          
//         const componentData = ComponentEngine.astroNodeToComponent(element, pathResult.importPath.toString()); 
//         if (componentData.isFailure) {
//             return Result.fail(
//                 `nodeToComponent(componentNode='${element.name}', pathResult='${pathResult}'): ${componentData.errorTitle}`,
//                 componentData.errorDescription!
//             )
//         }
//         return Result.ok({id: ComponentIdentity.Component, data: componentData.getValue()})
//     }

//     return Result.fail(
//         `Unsupported component type`,
//         `Only RpcCalls and Layouts are identifiable for now`,
//     )
// }


// ///////////////////////////////////////////////////////////////////////////////////
// //
// // Layout specific methods
// //
// ///////////////////////////////////////////////////////////////////////////////////

// /**
//      * Identify the components in the layout node. 
//      * The identified components are pushed into the page's layout.
//      * Only the Components are supported, the nested layout or RPC calls inside the layout is prohibited.
//      * @param {NodeType} layoutNode 
//      * @returns {Result<Page>}
//      * @todo Include the nested components
//  */
// const identifyLayoutComponents = async<T>(page: Page, uiContent: UiContent, memory: ModuleMemory<T>, layoutNode: AstroNode): Promise<Result<Page>> => {
//         for (const child of layoutNode.children) {
//             if (child.type === "text" || child.type === "comment" || child.type === "doctype") {
//                 continue;
//             }
//             if (child.type !== "component" && 
//                 child.type !== "element" && 
//                 child.type !== "expression") {
//                 return Result.fail(
//                     `Unsupported component in layout`, 
//                     `One of the components is of '${child.type}' kind which is not yet supported by Ara Web`
//                 )
//             }
    
//             const identificationResult = await identifyComponent(page, uiContent, memory, child)
//             if (identificationResult.isFailure) {
//                 return Result.fail(
//                     `this.identifyComponent(child=${componentName(child)}): ${identificationResult.errorTitle}`, 
//                     identificationResult.errorDescription!
//                 )
//             }

//             const layoutSlugsResult = await detectComponentLayoutSlug(page, uiContent, child)
//             if (layoutSlugsResult.isFailure) {
//                 return Result.fail(
//                     `this.detectComponentLayoutSlug(child=${componentName(child)}): ${layoutSlugsResult.errorTitle}`, 
//                     layoutSlugsResult.errorDescription!,
//                 )
//             }

//             pushComponentAtLayoutSlugs(page, identificationResult.getValue(), layoutSlugsResult.getValue());
//         }
    
//         return Result.ok(page);
//     }

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
    