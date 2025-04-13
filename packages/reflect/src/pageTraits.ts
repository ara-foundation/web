/**
 * Ara Web Level Reflection that deals with the Astro Components and Astro Component Attributes
 */
import type { AttributeNode, ExpressionNode, Node as AstroComponentNode } from "@astrojs/compiler/types";
import { parse as commentParse} from "comment-parser";

import { ColumnSlug, RowSlug, ComponentIdentity, Result } from "@ara-web/ts-enhancement";
import type { LayoutSlugs, Expression, Page, IdentifiedComponent, Component } from "@ara-web/ts-enhancement";

// The pages traits adds to the Page the following:
// -- RPCs and refer to RPC types
// -- File Content
// -- AST
// -- Components
import { RpcType, type RpcCallType, isRpcComponent as isRpcCallComponent, rpcBySlug } from "@ara-web/rpc-engine";
import { FileExtension, type FileContent } from "./fileLevel.js";
import { Code } from "./codeLevel.js";
// Make sure that we move the component
import { expressionCategory, type ComponentNode, ComponentEngine } from "@ara-web/component-engine";

//////////////////////////////////////////////////////////////////
//
// The internal data types
//
//////////////////////////////////////////////////////////////////

export class PageTraits {
    private page!: Page;
    private fileContent: FileContent;
    private code!: Code;

    //////////////////////////////////////////////////////////////////////////////
    //
    // Initialization
    //
    //////////////////////////////////////////////////////////////////////////////

    private constructor(fileContent: FileContent) {
        this.fileContent = fileContent;
    }

    /**
     * Converts the file content into the page trait
     * @param {FileContent} fileContent 
     * @returns {error?: string, data?: PageTraits}
     */
    public static fromFileContent = (fileContent: FileContent): Result<PageTraits> => {
        let pageTraits = new PageTraits(fileContent);
        const result = pageTraits.identifyPageByFileContent()
        
        if (result.isFailure) {
            return Result.fail("identifyPageByFileContent: " + result.errorTitle!, result.errorDescription!)
        } else {
            pageTraits.page = result.getValue();
        }

        const commentResult = pageTraits.identifyPageByComment();
        if (commentResult.isFailure) {
            return Result.fail("identifyPageByComment: " + result.errorTitle!, result.errorDescription!)
        }

        if (pageTraits.page.rpcs === undefined) {
            pageTraits.page.rpcs = {};
        }
        if (pageTraits.page.components === undefined) {
            pageTraits.page.components = {};
        }
        if (pageTraits.page.metaComponents === undefined) {
            pageTraits.page.metaComponents = [];
        }

        pageTraits.code = new Code(fileContent.source!);

        return Result.ok(pageTraits);
    }

    /**
     * Validates the file content to be a page.
     * The pages are for example only .astro files that has frontmatter and at least a one component.
     * @returns {Page}
     */
    private identifyPageByFileContent = (): Result<Page> => {
        const page: Page = {
            title: "Warning: Undefined",
            description: "Not yet set",
            fileName: this.fileContent.filePath.substring(this.fileContent.filePath.lastIndexOf("/src/pages") + "/src/pages".length),
            glob: this.fileContent.glob,
        }
    
        if (this.fileContent.error !== undefined) {
            return Result.fail("file content is invalid", `fileLevel error: ${this.fileContent.error}`);
        }
    
        if (this.fileContent.fileExtension !== FileExtension.Astro) {
            return Result.fail("Unsupported page type", "Only .astro files should be in the pages")
        }
        if (this.fileContent.source === undefined) {
            return Result.fail("Missing scripts in astro frontmatter", "Please include the astro scripts even if its empty");
        }
    
        if (this.fileContent.nodes === undefined) {
            return Result.fail("Missing any component", "Please include the any component even if its empty");
        }
    
        return Result.ok(page);
    }

    /**
     * Extracts the Title, Description from the Page Meta.
     * Returns true if extraction was successful. Otherwise returns false and
     * the error message will be set in the page.title and page.description
     */
    private identifyPageByComment = (): Result<undefined> => {
        const parsed = commentParse(this.fileContent.source!);
        if (parsed.length === 0) {
            return Result.fail("Page has no comment", "The web page is missing any comment in the JSDoc format")
        }
    
        let pageCommentFound = false;
        let pageTitleFound = false;
        let pageDescriptionFound = false;
        
        for (let block of parsed) {
            for (let tag of block.tags) {
                if (tag.tag === "this") {
                    if (tag.name === "Page") {
                        pageCommentFound = true;
                    }
                } else if (tag.tag === "param") {
                    if (tag.type !== "string") {
                        continue;
                    }
                    if (tag.name === "Title") {
                        if (tag.description.length > 0) {
                            this.page.title = tag.description;
                            pageTitleFound = true;
                        }
                    } else if (tag.name === "Description") {
                        if (tag.description.length > 0) {
                            this.page.description = tag.description;
                            pageDescriptionFound = true;
                        }
                    }
                }
            }
    
            if (!pageCommentFound) {
                return Result.fail("Invalid Comment Detection", "Missing a '@type Page' in the page comment")
            } else if (!pageTitleFound) {
                return Result.fail("Invalid Title", "Missing the '@param {string} Title {...}'")
            } else if (!pageDescriptionFound) {
                return Result.fail("Invalid Description", "Missing the '@param {string} Description {...}' in the page comment")
            } 
    
            if (pageCommentFound && pageTitleFound && pageDescriptionFound) {
                return Result.ok();
            }
        }
    
        return Result.fail("Invalid Page Comment Detection", "No comment dedicated for the web page itself");
    }

    //////////////////////////////////////////////////////////////////////////////
    //
    // Public methods
    //
    //////////////////////////////////////////////////////////////////////////////

    /**
     * Identify each component within the page. All data of the page are represented as the components.
     * @returns {Result<Page>}
     */
    public identifyComponents = async (): Promise<Result<Page>> => {
        for (let componentNode of this.fileContent.nodes!) {
            const identificationResult = await this.identifyComponent(componentNode)
            if (identificationResult.isFailure) {
                console.log(componentNode)
                return Result.fail(
                    `this.identifyComponent(componentNode=${PageTraits.componentName(componentNode)}): ${identificationResult.errorTitle}`, 
                    identificationResult.errorDescription!
                )
            }
            const identifiedComponent = identificationResult.getValue();
            
            // Let's detect the ComponentType
            if (identifiedComponent.id === ComponentIdentity.Undeclared) {
                return Result.fail(`code.identifyComponent(componentNode='${PageTraits.componentName(componentNode)}'): error`, 'The component type is not supported by Ara Web')
            } else if (identifiedComponent.id === ComponentIdentity.Component || 
                identifiedComponent.id === ComponentIdentity.Expression) {
                this.page.metaComponents?.push(identifiedComponent);
                continue;
            } else if (identifiedComponent.id === ComponentIdentity.Rpc) {
                if (this.page.rpcs === undefined) {
                    this.page.rpcs = {};
                }
                const componentData = identifiedComponent as RpcCallType;
                if (componentData.rpcType === RpcType.Extension) {
                    if (this.page.rpcs.extension === undefined) {
                        this.page.rpcs.extension = [];
                    }
                    this.page.rpcs.extension.push(componentData)
                } else if (componentData.rpcType === RpcType.Independent) {
                    if (this.page.rpcs.independent === undefined) {
                        this.page.rpcs.independent = [];
                    }
                    this.page.rpcs.independent.push(componentData)
                } else if (componentData.rpcType === RpcType.Proxy) {
                    if (this.page.rpcs.proxy === undefined) {
                        this.page.rpcs.proxy = [];
                    }
                    this.page.rpcs.proxy.push(componentData)
                }
                continue;
            } else if (identifiedComponent.id === ComponentIdentity.Layout) {
                const identificationResult = await this.identifyLayoutComponents(componentNode);
                if (identificationResult.isFailure) {
                    return Result.fail(
                        `this.identifyLayoutComponents(componentNode='${PageTraits.componentName(componentNode)}'): ${identificationResult.errorTitle}`,
                        identificationResult.errorDescription!
                    )
                }
                continue;
            } else {
                console.log(`Component ${PageTraits.componentName(componentNode)} was not identified. It's neither Layout, nor Component nor RPC Call`);
            }
        }
        return Result.ok(this.page)
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
    private identifyLayoutComponents = async(layoutNode: ComponentNode): Promise<Result<Page>> => {
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
    
            const identificationResult = await this.identifyComponent(child)
            if (identificationResult.isFailure) {
                return Result.fail(
                    `this.identifyComponent(child=${PageTraits.componentName(child)}): ${identificationResult.errorTitle}`, 
                    identificationResult.errorDescription!
                )
            }

            const layoutSlugsResult = await this.detectComponentLayoutSlug(child)
            if (layoutSlugsResult.isFailure) {
                return Result.fail(
                    `this.detectComponentLayoutSlug(child=${PageTraits.componentName(child)}): ${layoutSlugsResult.errorTitle}`, 
                    layoutSlugsResult.errorDescription!,
                )
            }

            this.pushComponentAtLayoutSlugs(identificationResult.getValue(), layoutSlugsResult.getValue());
        }
    
        return Result.ok(this.page);
    }

    /**
     * Detect's the Component's layout within the page.
     * If no component layout was given then it's considered to be at the default layout: content-center
     * @param node
     */
    private detectComponentLayoutSlug = async (node: ComponentNode): Promise<Result<LayoutSlugs>> => {
        const data: LayoutSlugs = {column: ColumnSlug.Center}
        const columnSlugs = Object.values(ColumnSlug).filter(value => typeof value === 'string') as string[];
        const rowSlugs = Object.values(RowSlug).filter(value => typeof value === 'string') as string[];
    
        const attr = this.attributeByName(node, "slot")
        if (attr === undefined) {
            data.row = RowSlug.Content;
            data.column = ColumnSlug.Center;
            return Result.ok(data);
        }
    
        const slotAttr = await this.identifyAttribute<string>(attr);
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
    private pushComponentAtLayoutSlugs = (node: IdentifiedComponent, layoutSlugs: LayoutSlugs) => {
        if (this.page.components === undefined) {
            this.page.components = {};
        }
    
        if (this.page.components[layoutSlugs.row!] === undefined) {
            this.page.components[layoutSlugs.row!] = {};
        }
    
        if (this.page.components[layoutSlugs.row!]![layoutSlugs.column] === undefined) {
            this.page.components[layoutSlugs.row!]![layoutSlugs.column] = [];
        }
    
        this.page.components[layoutSlugs.row!]![layoutSlugs.column]?.push(node);
    }
    
    //////////////////////////////////////////////////////////////////////////////////
    //
    // Component specific methods
    //
    //////////////////////////////////////////////////////////////////////////////////

    public static componentName = (component: ComponentNode|IdentifiedComponent): string => {
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
        component = component as ComponentNode;

        if (component.type === "expression") {
            return `Expression with ${component.children[0].type}`
        }
        return component.name;
    }

    public static isSupportedNode = (node: AstroComponentNode): boolean => {
        return node.type === "component" || node.type === "element" || node.type === "expression"
    }

    private identifyExpression = async (componentNode: ExpressionNode): Promise<Result<Expression>> => {
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
            
            if (!PageTraits.isSupportedNode(child)) {
                console.log(`The expression has a child which is not supported by Ara Web yet:`);
                console.log(child);
                continue;
            }
            const content = await this.identifyComponent(child as ComponentNode);
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
            fileName: ``,
            glob: componentNode,

            label: `<Expression>`,
            prefix,
            suffix,
            elements: elements,
        }

        return Result.ok(expression);
    }
    
    /**
     * Identifies what kind of component and it's value.
     * @param componentNode Node that we need to identify
     * @returns {IdentifiedComponent}
    */
    public identifyComponent = async (componentNode: ComponentNode): Promise<Result<IdentifiedComponent>> => {
        if (componentNode.type === "element") {
            const element = ComponentEngine.astroElementNodeToComponent(componentNode);
            return Result.ok({...element, id: ComponentIdentity.Component})
        } else if (componentNode.type === "expression") {
                const identificationResult = await this.identifyExpression(componentNode as ExpressionNode)
                if (identificationResult.isFailure) {
                    return Result.fail(
                        `expression componentNode: this.identfyExpression: ${identificationResult.errorTitle}`,
                        identificationResult.errorDescription!
                    )
                }
                
                return Result.ok({id: ComponentIdentity.Expression, ...(identificationResult.getValue())})
        } 
        const pathResult = this.code.identifyImportPath(componentNode.name);
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
            const identificationResult = await this.identifyRpcCallComponent(componentNode);
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
     * If the component is RPC Call, then find out its data by checking the script
     * @param componentNode Component parameter
     * @param astSource If the RPC Call is not a string literal but an expression that is defined in the script, then find 
     * its value from traversing in the AST
     * @returns {RpcCallType|undefined}
     */
    private identifyRpcCallComponent = async (componentNode: ComponentNode): Promise<Result<RpcCallType>> => {
        const attrName = "rpcCall";
        const attr = this.attributeByName(componentNode, attrName);
        if (attr === undefined) {
            return Result.fail(
                `this.attributeByName(componentNode=(${JSON.stringify(componentNode)}), attrName='${attrName}')`,
                `Attribute not found`
            )
        }
    
        // Get the RPC Call value
        const data = await this.identifyAttribute<RpcCallType>(attr);
    
        if (data.isFailure) {
            return Result.fail(
               `identifyAttribute(attr=${attr.name}): ${data.errorTitle}`,
               data.errorDescription!
            )
        }
    
        return Result.ok(data.getValue());
    }

    ////////////////////////////////////////////////////////////////////
    //
    // Component's Attribute specific methods
    //
    /////////////////////////////////////////////////////////////////////

    /**
     * Look up and retreive the attribute by its name
     * @param {AttributeNode[]} attrs list of attributes of a sinle component 
     * @param {string} name name of the attribute 
     * @returns {AttributeNode}
    */
    private attributeByName = (node: ComponentNode, name?: string): AttributeNode|undefined => {
        if (node.type === "expression") {
            return this.attributeByName(node.children[1] as ComponentNode)
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
    public identifyAttribute = async <T>(attr: AttributeNode, kind?: string): Promise<Result<T>> => {
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

        const attrValue = await this.code.identifyCodePiece<T>(attr.value);
        if (attrValue.isFailure) {
            return Result.fail(
                `identifyCodePiece(attr.value=${attr.value}): ${attrValue.errorTitle}`,
                attrValue.errorDescription!
            )
        }

        return Result.ok(attrValue.getValue())
    }
}