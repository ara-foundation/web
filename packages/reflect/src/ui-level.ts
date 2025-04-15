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
import type { AttributeNode, ExpressionNode, Node as AstroComponentNode } from "@astrojs/compiler/types";
import { parse as commentParse} from "comment-parser";

import { ColumnSlug, RowSlug, ComponentIdentity, Result, Debug } from "@ara-web/ts-enhancement";
import type { LayoutSlugs, Expression, Page, IdentifiedComponent, Component } from "@ara-web/ts-enhancement";

// The pages traits adds to the Page the following:
// -- RPCs and refer to RPC types
// -- File Content
// -- AST
// -- Components
import { RpcType, type RpcCallType, isRpcCallComponentLink, rpcBySlug } from "@ara-web/rpc-engine";
import { FileExtension, type UiContent } from "./fileLevel.js";
// Make sure that we move the component
import { expressionCategory, type AstroNode, ComponentEngine } from "@ara-web/component-engine";
import { PageTraits } from "./PageTraits.js";

////////////////////////////////////////////////////////////////////
//
// Component's Attribute specific methods
//
/////////////////////////////////////////////////////////////////////

/**
 * Look up and retreive the attribute by its name
 * @param {AstroNode} node that has the attributes of a sinle component 
 * @param {string} name name of the attribute 
 * @returns {AttributeNode}
*/
const attributeByName = (node: AstroNode, name?: string): AttributeNode|undefined => {
        if (node.type === "expression") {
            return attributeByName(node.children[1] as AstroNode)
        }
        for (let callAttr of node.attributes) {
            if (callAttr.name === name) {
                return callAttr;
            }
        }
}

/**
 * Find the page attribute's value of the component.
 * Expected to be called by identifyComponent()
 * @param {AttributeNode} attr expression in the attribute
*/
const identifyAttribute = async <T>(pageTraits: PageTraits, attr: AttributeNode, kind?: string): Promise<Result<T>> => {
            const ret: {error?: string, data?: T} = {
                error: undefined,
                data: undefined,
            }
    
        if (kind !== undefined && attr.kind !== kind) {
            return Result.fail(
                `Attribute kind mismatch`,
                `The '${attr.name}' attribute's is '${attr.kind}' of kind, when expected '${kind}' kind`
            )
        }

        if (attr.kind === "quoted") {
            return Result.ok(attr.value as T)
        } else if (attr.kind !== "expression") {
            return Result.fail(
                `Unsupported attribute kind '${attr.kind}'`,
                `Ara Web supports quoted and expression kind of attributes only`
            )
        }

        const attrValue = await pageTraits.code.identifyCodePiece<T>(attr.value);
        if (attrValue.isFailure) {
            return Result.fail(
                `identifyCodePiece(attr.value=${attr.value}): ${attrValue.errorTitle}`,
                attrValue.errorDescription!
            )
        }

        return Result.ok(attrValue.getValue())
}

//////////////////////////////////////////////////////////////////////////////////
//
// Component specific methods
//
//////////////////////////////////////////////////////////////////////////////////

const componentName = (component: AstroNode|IdentifiedComponent): string => {
    const identifiedComponent = (component as IdentifiedComponent);
    if (identifiedComponent !== undefined) {
        if (identifiedComponent.id === ComponentIdentity.Expression) {
            return (identifiedComponent as Expression).label;
        } else if (identifiedComponent.id === ComponentIdentity.Layout) {
            return (identifiedComponent as Component).label
        } else if (identifiedComponent.id === ComponentIdentity.Undeclared) {
            return `Undeclared component`
        } else if (identifiedComponent.id === ComponentIdentity.Rpc) {
            const rpc = rpcBySlug((identifiedComponent as RpcCallType).slug)
            return rpc === undefined ? (identifiedComponent as RpcCallType).slug : rpc.name!; 
        } else if (identifiedComponent.id === ComponentIdentity.Component) {
            return (identifiedComponent as Component).label;
        }
    }
    
    component = component as AstroNode;

    if (component.type === "expression") {
        return `Expression with ${component.children[0].type}`
    }
    return component.name;
}

const isSupportedNode = (node: AstroComponentNode): boolean => {
    return node.type === "component" || node.type === "element" || node.type === "expression"
}

const identifyExpression = async (pageTraits: PageTraits, componentNode: ExpressionNode): Promise<Result<Expression>> => {
    const elements: IdentifiedComponent[] = [];
    let prefix: string|undefined = undefined;
    let suffix: string|undefined = undefined;
    for (let i = 0; i< componentNode.children.length; i++) {
        const child = componentNode.children[i];
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
        
        if (!isSupportedNode(child)) {
            console.log(`The expression has a child which is not supported by Ara Web yet:`);
            console.log(child);
            continue;
        }
        const content = await identifyComponent(pageTraits, child as AstroNode);
        if (content.isFailure) {
            return Result.fail(
                `Invalid first element of expression:(component(i='${i}')='${componentNode.children[1].type}'): ${content.errorTitle}`,
                `Let the first element to be not something like comment or anything that is node NodeType: ${content.errorDescription}`,
            )
        }
        elements.push(content.getValue());
    }
    if (prefix === undefined) {
        if (elements.length === 0) {
            prefix = `Undefined syntax in the page, Ara Web doesn't support it`
        } else {
            prefix = elements[0].id
        }
    }
    if (suffix === undefined) {
        if (elements.length === 0) {
            suffix = `Undefined syntax in the page, Ara Web doesn't support it`
        } else if (elements.length > 1) {
            suffix = elements[elements.length-1].id
        } else {
            suffix = ``
        }
    }

    const expression: Expression = {
        category: expressionCategory,
        description: ``,
        modulePath: ``,
        glob: componentNode,

        label: `<Expression>`,
        prefix,
        suffix,
        elements: elements,
    }

    return Result.ok(expression);
}

/**
 * If the component is RPC Call, then find out its data by checking the script
 * @param componentNode Component parameter
 * @param astSource If the RPC Call is not a string literal but an expression that is defined in the script, then find 
 * its value from traversing in the AST
 * @returns {RpcCallType|undefined}
 */
const identifyRpcCallComponent = async (pageTraits: PageTraits, componentNode: AstroNode): Promise<Result<RpcCallType>> => {
    const attrName = "rpcCall";
    const attr = attributeByName(componentNode, attrName);
    if (attr === undefined) {
        return Result.fail(
            `this.attributeByName(componentNode=(${JSON.stringify(componentNode)}), attrName='${attrName}')`,
            `Attribute not found`
        )
    }

    // Get the RPC Call value
    const data = await identifyAttribute<RpcCallType>(pageTraits, attr);

    if (data.isFailure) {
        return Result.fail(
           `identifyAttribute(attr=${attr.name}): ${data.errorTitle}`,
           data.errorDescription!
        )
    }

    return Result.ok(data.getValue());
}


/**
 * Identifies what kind of component and it's value.
 * @param componentNode Node that we need to identify
 * @returns {IdentifiedComponent}
 */
const identifyComponent = async (pageTraits: PageTraits, componentNode: AstroNode): Promise<Result<IdentifiedComponent>> => {
    if (componentNode.type === "element") {
        const element = ComponentEngine.astroElementNodeToComponent(componentNode);
        return Result.ok({...element, id: ComponentIdentity.Component})
    } else if (componentNode.type === "expression") {
            const identificationResult = await identifyExpression(pageTraits, componentNode as ExpressionNode)
            if (identificationResult.isFailure) {
                return Result.fail(
                    `expression componentNode: this.identfyExpression: ${identificationResult.errorTitle}`,
                    identificationResult.errorDescription!
                )
            }
            
            return Result.ok({id: ComponentIdentity.Expression, ...(identificationResult.getValue())})
    } 
    const pathResult = pageTraits.code.identifyImportPath(componentNode.name);
    if (pathResult.isFailure) {
        return Result.fail(
            `this.code.identifyImportPath(componentNode.name='${componentNode.name}'): ${pathResult.errorTitle}`,
            pathResult.errorDescription!,
        )
    }

    /////////////////////////////////////////////////////////////////////////////////
    //
    // Component was loaded as the import declaration, identify the type
    //
    /////////////////////////////////////////////////////////////////////////////////
    
    //
    // Component indicates an RPC Call?
    //
    if (isRpcCallComponent(pathResult.getValue())) {
        const identificationResult = await identifyRpcCallComponent(pageTraits, componentNode);
        if (identificationResult.isFailure) {
            return Result.fail(
                `this.identifyRpcCallComponent(componentNode='${componentNode.name}'): ${identificationResult.errorTitle}`,
                identificationResult.errorDescription!,
            )
        } else {
            return Result.ok({
                id: ComponentIdentity.Rpc,
                ...identificationResult.getValue()
            })
        }
    } else if (ComponentEngine.isLayoutModulePath(pathResult.getValue())) {
        return Result.ok({
            id: ComponentIdentity.Layout,
            ...ComponentEngine.astroLayoutNodeToComponent(componentNode, pathResult.getValue())
        })
    } else if (componentNode.type === "component") {          
        const componentData = ComponentEngine.astroNodeToComponent(componentNode, pathResult.getValue()); 
        if (componentData.isFailure) {
            return Result.fail(
                `nodeToComponent(componentNode='${componentNode.name}', pathResult='${pathResult.getValue()}'): ${componentData.errorTitle}`,
                componentData.errorDescription!
            )
        }
        return Result.ok({id: ComponentIdentity.Component, ...(componentData.getValue())})
    }

    return Result.fail(
        `Unsupported component type`,
        `Only RpcCalls and Layouts are identifiable for now`,
    )
}


/**
 * Identify each component within the page. All data of the page are represented as the components.
 * @returns {Result<Page>}
 */
export const identifyComponents = async (pageTraits: PageTraits, nodes: AstroNode[]): Promise<Result<Page>> => {
    for (let componentNode of nodes) {
        const identificationResult = await identifyComponent(pageTraits, componentNode)
        if (identificationResult.isFailure) {
            const err = Debug.error(
                `this.identifyComponent(componentNode: ${componentName(componentNode)}): ${identificationResult.errorTitle}`, 
                 identificationResult.errorDescription!,
                componentNode,
            )    
            
            return Result.fail(err)
        }
        
        const identifiedComponent = identificationResult.getValue();
            
            // Let's detect the ComponentType
            if (identifiedComponent.id === ComponentIdentity.Undeclared) {
                return Result.fail(`code.identifyComponent(componentNode='${componentName(componentNode)}'): error`, 'The component type is not supported by Ara Web')
            } else if (identifiedComponent.id === ComponentIdentity.Component || 
                identifiedComponent.id === ComponentIdentity.Expression) {
                pageTraits.page.metaComponents?.push(identifiedComponent);
                continue;
            } else if (identifiedComponent.id === ComponentIdentity.Rpc) {
                if (pageTraits.page.rpcs === undefined) {
                    pageTraits.page.rpcs = {};
                }
                const componentData = identifiedComponent as RpcCallType;
                if (componentData.rpcType === RpcType.Extension) {
                    if (pageTraits.page.rpcs.extension === undefined) {
                        pageTraits.page.rpcs.extension = [];
                    }
                    pageTraits.page.rpcs.extension.push(componentData)
                } else if (componentData.rpcType === RpcType.Independent) {
                    if (pageTraits.page.rpcs.independent === undefined) {
                        pageTraits.page.rpcs.independent = [];
                    }
                    pageTraits.page.rpcs.independent.push(componentData)
                } else if (componentData.rpcType === RpcType.Proxy) {
                    if (pageTraits.page.rpcs.proxy === undefined) {
                        pageTraits.page.rpcs.proxy = [];
                    }
                    pageTraits.page.rpcs.proxy.push(componentData)
                }
                continue;
            } else if (identifiedComponent.id === ComponentIdentity.Layout) {
                const identificationResult = await identifyLayoutComponents(pageTraits, componentNode);
                if (identificationResult.isFailure) {
                    return Result.fail(
                        `this.identifyLayoutComponents(componentNode='${componentName(componentNode)}'): ${identificationResult.errorTitle}`,
                        identificationResult.errorDescription!
                    )
                }
                continue;
            } else {
                console.log(`Component ${componentName(componentNode)} was not identified. It's neither Layout, nor Component nor RPC Call`);
            }
        }
        return Result.ok(pageTraits.page)
}

    ///////////////////////////////////////////////////////////////////////////////////
    //
    // Layout specific methods
    //
    ///////////////////////////////////////////////////////////////////////////////////

    /**
     * Identify the components in the layout node. 
     * The identified components are pushed into the page's layout.
     * Only the Components are supported, the nested layout or RPC calls inside the layout is prohibited.
     * @param {NodeType} layoutNode 
     * @returns {Result<Page>}
     * @todo Include the nested components
     */
const identifyLayoutComponents = async(pageTraits: PageTraits, layoutNode: AstroNode): Promise<Result<Page>> => {
        for (const child of layoutNode.children) {
            if (child.type === "text" || child.type === "comment" || child.type === "doctype") {
                continue;
            }
            if (child.type !== "component" && 
                child.type !== "element" && 
                child.type !== "expression") {
                return Result.fail(
                    `Unsupported component in layout`, 
                    `One of the components is of '${child.type}' kind which is not yet supported by Ara Web`
                )
            }
    
            const identificationResult = await identifyComponent(pageTraits, child)
            if (identificationResult.isFailure) {
                return Result.fail(
                    `this.identifyComponent(child=${componentName(child)}): ${identificationResult.errorTitle}`, 
                    identificationResult.errorDescription!
                )
            }

            const layoutSlugsResult = await detectComponentLayoutSlug(pageTraits, child)
            if (layoutSlugsResult.isFailure) {
                return Result.fail(
                    `this.detectComponentLayoutSlug(child=${componentName(child)}): ${layoutSlugsResult.errorTitle}`, 
                    layoutSlugsResult.errorDescription!,
                )
            }

            pushComponentAtLayoutSlugs(pageTraits, identificationResult.getValue(), layoutSlugsResult.getValue());
        }
    
        return Result.ok(pageTraits.page);
    }

    /**
     * Detect's the Component's layout within the page.
     * If no component layout was given then it's considered to be at the default layout: content-center
     * @param node
     */
const detectComponentLayoutSlug = async (pageTraits: PageTraits, node: AstroNode): Promise<Result<LayoutSlugs>> => {
        const data: LayoutSlugs = {column: ColumnSlug.Center}
        const columnSlugs = Object.values(ColumnSlug).filter(value => typeof value === 'string') as string[];
        const rowSlugs = Object.values(RowSlug).filter(value => typeof value === 'string') as string[];
    
        const attr = attributeByName(node, "slot")
        if (attr === undefined) {
            data.row = RowSlug.Content;
            data.column = ColumnSlug.Center;
            return Result.ok(data);
        }
    
        const slotAttr = await identifyAttribute<string>(pageTraits, attr);
        if (slotAttr.isFailure) {
            return Result.fail(
                `this.identifyAttribute<string>(attr='${attr.name}'): ${slotAttr.errorTitle}`,
                slotAttr.errorDescription!,
            )
        }
        const slotData = slotAttr.getValue();
        if (slotData === undefined || slotData.length === 0) {
            data.row = RowSlug.Content;
            data.column = ColumnSlug.Center;
            return Result.ok(data)
        }
    
        let slugs: string[] = slotData.split("-");
    
        if (slugs.length === 1) {
            if (columnSlugs.indexOf(slugs[0]) > -1) {
                data.column = slugs[0] as ColumnSlug
            }
        } else if (slugs.length === 2) {
            if (columnSlugs.indexOf(slugs[1]) > -1) {
                data.column = slugs[1] as ColumnSlug
            
                if (rowSlugs.indexOf(slugs[0]) > -1) {
                    data.row = slugs[0] as RowSlug
                }
            }
        }
        
        return Result.ok(data);
    }

    /**
     * Add the component into the page at the layout
     * @param node The component to add
     * @param layoutSlugs The layout to pass the page
     */
    const pushComponentAtLayoutSlugs = (pageTraits: PageTraits, node: IdentifiedComponent, layoutSlugs: LayoutSlugs) => {
        if (pageTraits.page.components === undefined) {
            pageTraits.page.components = {};
        }
    
        if (pageTraits.page.components[layoutSlugs.row!] === undefined) {
            pageTraits.page.components[layoutSlugs.row!] = {};
        }
    
        if (pageTraits.page.components[layoutSlugs.row!]![layoutSlugs.column] === undefined) {
            pageTraits.page.components[layoutSlugs.row!]![layoutSlugs.column] = [];
        }
    
        pageTraits.page.components[layoutSlugs.row!]![layoutSlugs.column]?.push(node);
    }
    