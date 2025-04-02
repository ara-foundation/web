/**
 * The script that works with the code by turning it into the 
 * AST (Abstract Syntax Tree)
 * @todo Make the components nested to each other
 * @todo Optimize the AST traverse
 * @todo fix the parsing of all pages
 * @todo make a split between AraWeb and Code levels
 * @todo change scripts/page.ts=>Page.components type to Component
 * @todo somehow we need to show on PageModal the meta components
 */
import { isRpcComponent as isRpcCallComponent } from "@scripts/rpc";
import { 
    CallExpression,
    Identifier, ImportClause, JSDoc, Project, SourceFile as TsSourceFile, StringLiteral, ts, TypeReferenceNode, 
    VariableDeclarationKind,
    SyntaxList,
    ImportDeclaration,
    ExpressionStatement,
    BinaryExpression,
    ObjectLiteralExpression,
    SpreadAssignment,
    PropertyAssignment,
    VariableDeclaration,
    ArrayLiteralExpression,
    PropertyAccessExpression,
    EnumMember,
    NumericLiteral
} from "ts-morph";
import { callFuncInModule, fileContentByModulePath, type NodeType } from "./fileLevel";
import type { RpcCallType } from "@scripts/rpc/types";
import type { AttributeNode } from "@astrojs/compiler/types";
import { isLayout } from "@scripts/component";
import { unquote } from "@scripts/string";

/**
 * Given the component, identify what it is
 */
export enum ComponentIdentity {
    Rpc = "rpc",                   // RPCs are identified by the imported components
    Layout = "layout",             // The page layout
    Component = "component",       // Component
    Undeclared = "undeclared",     // Unexpected
}

export enum AstNodeIdentity {
    Undeclared,
    Variable,
    Enum,
}

export type ComponentData = NodeType | RpcCallType

export type ComponentIdentificationResult = {
    id: ComponentIdentity,
    data?: any,
    error?: string,
}

export type EnumMembers = {[key: string]: string|number};

export class Code {
    ast: TsSourceFile;
    code: string;
    project: Project;

    /**
     * Convert the source code into the AST tree
     * @param source the typescript code
     */
    constructor(code: string) {
        this.code = code;
        this.project = new Project({
            useInMemoryFileSystem: true
        })
        this.ast = this.project.createSourceFile(`__temp.ts`, code);
    }

    /**
     * Identifies what kind of component and it's value
     * @param componentNode Node that we need to identify
     * @param source Source code if we need to determine the component as a module or the component attributes
     * @returns {ComponentIdentity}
     * 
     * For now, it only supports components that were imported
     */
    public identifyComponent = async (componentNode: NodeType): Promise<ComponentIdentificationResult> => {
        if (componentNode.type === "element") {
            return {id: ComponentIdentity.Component, data: componentNode};
        } else if (componentNode.type !== "component") {
            // For future references, for now it supports component and element, so it won't be catched
            return {id: ComponentIdentity.Undeclared, data: undefined, error: `Only component types supported`}
        }
        
        const result = await this.identifyComponentInImports(componentNode);
        if (result.error) {
            return {
                id: result.id,
                error: `identifyComponentInImports(componentNode=${componentNode.name}): ${result.error}`
            };
        }
        if (result.id !== ComponentIdentity.Undeclared) {
            return result
        }

        return {id: ComponentIdentity.Undeclared};
    }

    /**
     * Identify the component by its path by using the page's import statements.
     * @param componentNode Component in the Astro file
     * @param astSource The frontmatter code
     * @returns {found: boolean, data: RpcCallType}
     */
    private identifyComponentInImports = async (componentNode: NodeType): Promise<ComponentIdentificationResult> => {
        const ret: ComponentIdentificationResult = {
            id: ComponentIdentity.Undeclared,
            data: undefined,
            error: undefined,
        }

        const astImport = this.identifyImportDeclaration(componentNode.name);
        if (astImport === undefined) {
            return {
                id: ComponentIdentity.Undeclared,
                error: `this.identifyImportDeclaration(componentNode.name=${componentNode.name})`
            }
        }

        const importPath = this.identifyImportPath(componentNode.name);
        if (importPath.error !== undefined) {
            return {
                id: ComponentIdentity.Undeclared,
                error: `identifyImportPath(${componentNode.name}): ${importPath.error}`
            }
        }

        /////////////////////////////////////////////////////////////////////////////////
        //
        // Component was loaded as the import declaration, identify the type
        //
        /////////////////////////////////////////////////////////////////////////////////

        //
        // Component indicates an RPC Call?
        //
        if (isRpcCallComponent(importPath.filePath!)) {
            ret.id = ComponentIdentity.Rpc;
            const {error, data} = await this.identifyRpcCallComponent(componentNode);
            if (error !== undefined) {
                ret.error = `Component is RPC Call but error to identify component values: ${error}`;
            } else {
                ret.data = data;
            }
            return ret;
        } else if (isLayout(importPath.filePath!)) {
            ret.id = ComponentIdentity.Layout;
            return ret;
        }
        
        //
        // Component indicates a layout?
        //
        ret.error = `Only RpcCalls and Layouts are identifiable for now`;

        return ret;
    }

    /**
     * Look up and retreive the attribute by its name
     * @param {AttributeNode[]} attrs list of attributes of a sinle component 
     * @param {string} name name of the attribute 
     * @returns {AttributeNode}
     */
    public attributeByName = (attrs: AttributeNode[], name: string): AttributeNode|undefined => {
        for (let callAttr of attrs) {
            if (callAttr.name === name) {
                return callAttr;
            }
        }
    }

    /**
     * If the component is RPC Call, then find out its data by checking the script
     * @param componentNode Component parameter
     * @param astSource If the RPC Call is not a string literal but an expression that is defined in the script, then find 
     * its value from traversing in the AST
     * @returns {RpcCallType|undefined}
     */
    private identifyRpcCallComponent = async (componentNode: NodeType): Promise<{error?: string, data?: RpcCallType}> => {
        const attrName = "rpcCall";
        const attr = this.attributeByName(componentNode.attributes, attrName);
        if (attr === undefined) {
            return {
                error: `The component <${componentNode.name}> doesn't have '${attrName}' attribute`
            }
        }

        // Get the RPC Call value
        const data = await this.identifyAttribute<RpcCallType>(attr);

        if (data.error !== undefined) {
            return {
                error: `identifyAttribute(attr=${attr.name}): ${data.error}`
            }
        }

        return data;
    }

    
    /**
     * Find the page attribute's value of the component.
     * Expected to be called by identifyComponent()
     * @param {AttributeNode} attr expression in the attribute
     */
    public identifyAttribute = async <T>(attr: AttributeNode, kind?: string): Promise<{error?: string, data?: T}> => {
        const ret: {error?: string, data?: T} = {
            error: undefined,
            data: undefined,
        }

        if (kind !== undefined && attr.kind !== kind) {
            return {error: `The '${attr.name}' attribute's is '${attr.kind}' of kind, when expected '${kind}' kind`}
        }
            
        if (attr.kind === "quoted") {
            ret.data = attr.value as T;
            return ret;
        } else if (attr.kind === "expression") {
            const attrValue = await this.identifyCodePiece<T>(attr.value);
            if (attrValue.error !== undefined) {
                ret.error = `identifyCodePiece(attr.value=${attr.value}): ${attrValue.error}`
                return ret;
            }
            ret.data = attrValue.data
        } else {
            return {
                error: `For only coderLevel => identifyAttribute supports quoted and expression kind of attributes`
            }
        }

        return ret;
    }

    /**
     * Clone the Code with the new AST.
     * Used to evaluate various attributes by manipulating AST itself.
     * @returns {Code}
     */
    clone = (): this => {
        return new (this.constructor as typeof Code)(this.code) as this;
    }

    /**
     * Find the result of the expression, by setting it as a variable declaration.
     * @param {string} exp a JS doc that after evaluating gives the result
     * @returns {T} the result of the expression
     */
    private identifyCodePiece = async <T>(exp: string): Promise<{error?: string, data?: T}> => {
        const ret: {error?: string, data?: T} = {}

        const varName = "__ara_web_exp";
        let cloned = this.clone();
        cloned.ast.addVariableStatement({
            declarationKind: VariableDeclarationKind.Const, // defaults to "let"
            declarations: [{
              name: varName,
              initializer: exp,
            }],
        });

        // It may be not only identifier so clone and put it in the ast
        var variable = await cloned.identifyVariable<T>(varName);
        // Once the _ara_web_exp is turned into the statement, get it's value.
        if (variable.error !== undefined) {
            return {error: `cloned.identifyVariable(varName=${varName}): ${variable.error}`}
        }
        if (variable.data === undefined) {
            return {error: `cloned.identifyVariable(varName=${varName}): no error, no data, data must exist`}
        }

        ret.data = variable.data;

        return ret;
    }

    /**
     * Variables values might be updated by assignment or by passing to the functions
     */
    private identifyVariableUpdates = async <T>(identifier: string, data: T): Promise<{error?: string, data?: T}> => {
        const updatedInFunction = this.identifyVariableUpdateInFunction<T>(identifier, data);
        if (updatedInFunction.error !== undefined) {
            return {
                error: `this.identifyVariableUpdateInFunction(identifier=${identifier}, data=${data}): ${updatedInFunction.error}`
            }
        }

        const updatedInAssignment = await this.identifyVariableAssignments<T>(identifier, data);
        if (updatedInAssignment.error !== undefined) {
            return {
                error: `this.identifyVariableAssignments(identifier=${identifier}, data=${data}): ${updatedInAssignment.error}`
            }
        }

        return {data};
    }

    /**
     * If the variable or variable's properties are updated, then this method will apply those changes.
     * Returns TRUE, if no assignments were found
     * @param data
     * @returns {error?: string, succeed: boolean}
     */
    private identifyVariableAssignments = async <T>(identifier: string, data: T): Promise<{error?: string, data?: T}> => {
        let ret: {error?: string, data?: T} = {};

        // To make it variable assignment, make sure we track ExpressionStatements and BinaryExpressions
        for (let child of this.ast.getChildren()) {
            for (let subChild of child.getChildren()) {
                if (subChild instanceof ExpressionStatement) {
                    const res = await this.identifyExpressionStatement<T>(identifier, data, subChild)
                    if (res.error !== undefined) {
                        ret.error = `identifyExpressionStatement(identifier=${identifier}, data=${data}, child=${subChild.getText()}): ${res.error}`
                    } else {
                        data = res.data!
                        return {data: res.data!};
                    }
                } else if (subChild instanceof BinaryExpression) {
                    const res = await this.identifyBinaryExpression<T>(identifier, data, subChild)
                    if (res.error !== undefined) {
                        return {
                            error: `identifyExpressionStatement(identifier=${identifier}, data=${data}, child=${subChild.getText()}): ${res.error}`
                        }
                    } else {
                        data = res.data!
                        return {
                            data: res.data!
                        };
                    }
                }
            }
        }

        return ret;
    }

    private identifyExpressionStatement = async<T>(identifier: string, data: T, exp: ExpressionStatement): Promise<{error?: string, data?: T}> => {
        for (let child of exp.getChildren()) {
            if (child instanceof BinaryExpression) {
                const res = await this.identifyBinaryExpression<T>(identifier, data, child);
                if (res.error !== undefined) {
                    return {
                        error: `identifyBinaryExpression(identifier=${identifier}, data=${JSON.stringify(data)}, child=${child.getText()}): ${res.error}`
                    }
                }
                return res;
            } else {
                console.log(`identifyExpressionStatement only supports BinaryExpressions for now. You gave:`);
                console.log(`Value='${child.getText()}'`);
                console.log(child)
                console.log(`\n\n`);
            }
        }

        return {
            error: `Only Binary Expressions are supported in identifyExpressionStatement`,
        }
    }

    private identifyBinaryExpression = async <T>(identifier: string, data: T, exp: BinaryExpression): Promise<{error?: string, data?: T}> => {
        const leftSide = exp.getChildAtIndex(0);
        const rightSide = exp.getChildAtIndex(2);
    
        if (leftSide instanceof Identifier) {
            if (leftSide.getText() !== identifier) {
                return {data};
            } else {
                const result = await this.identifyValue<T>(identifier, data, rightSide)
                if (result.error !== undefined) {
                    return {error: `identifyValue(data=${data}, rightSide=${rightSide.getText}): ${result.error}`}
                }
                if (result.data === undefined) {
                    return {error: `identifyValue(data=${data}, rightSide=${rightSide.getText}): no error, no data, inspect identifyValue`}
                }
                return result;
            }
        } else if (leftSide instanceof PropertyAccessExpression) {
            const varIdentifier = leftSide.getChildAtIndex(0);
            const propertyIdentifier = leftSide.getChildAtIndex(2);
            if (varIdentifier.getText() !== identifier) {
                return {data};
            }

            const propertyValue = (data as any)[propertyIdentifier.getText()]

            const result = await this.identifyValue<typeof propertyValue>(propertyIdentifier.getText(), propertyValue, rightSide)
            if (result.error !== undefined) {
                return {error: `identifyValue(data=${data}, rightSide=${rightSide.getText}): ${result.error}`}
            }
            if (result.data === undefined) {
                return {error: `identifyValue(data=${data}, rightSide=${rightSide.getText}): no error, no data, inspect identifyValue`}
            }

            (data as any)[propertyIdentifier.getText()] = result.data

            return {data}
        } else {
            console.log(`identifyBinaryExpression ts='${exp.getText()}' has ${exp.getChildCount()} nodes, let's begin (NOT SUPPORTED)..`);
            console.log(`Left='${leftSide.getText()}'`);
            console.log(leftSide)
            console.log(`Right=${rightSide.getText()}`);
            console.log(rightSide);
            console.log(`\identifyBinaryExpression end`);
            return {error: `Only Identifier left side of binary are supported for now for '${leftSide.getText()}=${rightSide.getText()}'`}
        }
    }

    /**
     * Identify the value of the identifier
     * @param {string} identifier identififer within the code
     */
    private identifyValueByIdentifier = async(identifier: string): Promise<{error?: string, data?: any, identity: AstNodeIdentity}> => {
        let res = await this.identifyVariable(identifier);
        if (res.error === undefined) {
            return {
                data: res.data,
                identity: AstNodeIdentity.Variable
            }
        }

        res = await this.identifyEnum(identifier);
        if (res.error === undefined) {
            return {
                data: res.data,
                identity: AstNodeIdentity.Enum
            }
        }

        return {
            error: `Not identified`,
            identity: AstNodeIdentity.Undeclared
        }
    }

    /**
     * Identify whether the given identifier is the enum, if so, return it's values
     * @param {string} identifier the enum name
     * @returns {error?: string, data? {[key: string]: string|number}} 
     */
    private identifyEnum = async(identifier: string): Promise<{error?: string, data?: EnumMembers}> => {
        let enumMembers: EnumMembers = {};
        const enumDeclaration = this.ast.getEnum(identifier);
        if (enumDeclaration === undefined) {
            return {
                error: `The '${identifier}' enum's declaration not found in the AST`
            };
        }

        let bracesOpened = false;
        for (let child of enumDeclaration.getChildren()) {
            if (child.getText() === "{") {
                bracesOpened = true;
                continue;
            } else if (child instanceof SyntaxList) {
                if (!bracesOpened) {
                    continue;
                }
                let propertyIndex = 0;
                for (let listEl of child.getChildren()) {
                    let propertyIdentifier: string = "";
                    let propertyValue: string|number|undefined = undefined;
                    // Could be an enum separator such as "," so we work with EnumMember
                    if (listEl instanceof EnumMember) {
                        let enumMember = listEl as EnumMember;
                        for (let enumData of enumMember.getChildren()) {
                            if (enumData instanceof Identifier) {
                                propertyIdentifier = enumData.getText();
                            } else if (enumData.getText() === "=") {
                                continue;
                            } else if (enumData instanceof StringLiteral) {
                                propertyValue = unquote(enumData.getText());
                            } else if (enumData instanceof NumericLiteral) {
                                propertyValue = JSON.parse(enumData.getText());
                            } else {
                                console.log(`enum (${identifier})'s enum member ${propertyIdentifier} is not a string literal, so we will use default numeration, catch it here in identifyEnum()`);
                                console.log(enumData)
                            }
                        }

                        if (propertyValue === undefined) {
                            propertyValue = propertyIndex++;
                        }

                        enumMembers[propertyIdentifier] = propertyValue;
                    }
                }
            }
        }

        return {
            data: enumMembers
        }
    }

    private identifyValue = async <T>(identifier: string|undefined, data: T, exp: any): Promise<{error?: string, data?: T}> => {
        if (exp instanceof ObjectLiteralExpression) {
            // ObjectLiteralExpression has three children:
            // @child {Node} '{'
            // @child {SyntaxList} anything
            // @child Node '}'
            const syntaxList = exp.getChildAtIndex(1);
            
            //////////////////////////////////////////////////
            //
            // Remove here syntax as identify value
            //
            //////////////////////////////////////////////////
            for (let i = 0; i < syntaxList.getChildCount(); i++) {
                const child = syntaxList.getChildAtIndex(i);
                // Delimeter is skipped
                if (child.getText() === ",") {
                    continue;
                }
                let identified: {
                    error?: string;
                    data?: T;
                } = {};
                identified = await this.identifyValue<T>(identifier, data, child);
                
                if (identified.error !== undefined) {
                    return {
                        error: `identifyingValue ${identifier} -> ObjectLiteral='${exp.getText()}' -> SyntaxList(${syntaxList.getText()}): identifyValue(${child.getText()}): ${identified.error}`
                    }
                } else {
                    data = {...identified.data!};
                }
            }
            return {data: data}
        } else if (exp instanceof SpreadAssignment) {
            const spreadSource = exp.getChildAtIndex(1);
            return await this.identifyValue<T>(identifier, data, spreadSource);
        } else if (exp instanceof PropertyAssignment) { // {obj.property: val}
            const property = exp.getChildAtIndex(0);
            const value = exp.getChildAtIndex(2);
            const propertyValue = (data[property.getText()]);
            
            // Assigned value to the (data: T).object's property
            const res = await this.identifyValue<typeof propertyValue>(property.getText(), (data as any)[property.getText()], value);
            if (res.error !== undefined) {
                return {
                    error: `propertyAssignment -> right assigned value -> identifyValue(rightAssignedValue=${property.getText()},data=${(data as any)[property.getText()]}, exp=${value.getText()}): ${res.error}`
                }
            }
            data[property.getText()] = res.data;
            return {
                data: data
            }
        } else if (exp instanceof Identifier) {
            if (exp.getText() === identifier) {
                return {data}
            } else {
                const identified = await this.identifyVariable<T>(exp.getText())
                if (identified.error !== undefined) {
                    return {
                        error: `identifying value of 'Identifier': identifyVariable(${exp.getText()}): ${identified.error}`
                    }
                }
                return {data: identified.data}
            }
        } else if (exp instanceof ArrayLiteralExpression) {
            const syntaxList = exp.getChildAtIndex(1);

            let oldIndex = 0;
            for (let i = 0; i < syntaxList.getChildCount(); i++) {
                const child = syntaxList.getChildAtIndex(i);
                // Delimeter is skipped
                if (child.getText() === ",") {
                    continue;
                }
                oldIndex++;
                let dataAtIndex = (data as any[])[oldIndex-1]
                let identified = await this.identifyValue<typeof dataAtIndex>(identifier, data, child);
                
                if (identified.error !== undefined) {
                    return {
                        error: `identifyValue ${identifier} ->ArrayLiteralExpression='${exp.getText()}': SyntaxList('${syntaxList.getText()}): 'identifyValue(identifier=${identifier},data=${JSON.stringify(data)}, child=${child.getText}): ${identified.error}`
                    }
                } else {
                    data[oldIndex - 1] = identified.data! as typeof dataAtIndex;
                }
            }

            return {data}
        } else if (exp instanceof PropertyAccessExpression) {
            const varIdentifier = exp.getChildAtIndex(0);
            const propertyIdentifier = exp.getChildAtIndex(2);
            
            // Attempt to find the variable's value within this script            
            const varValue = await this.identifyVariable(varIdentifier.getText());
            if (varValue.error !== undefined) {
                // If the variable wasn't defined within the script, then find it on
                // imports.
                const importPath = this.identifyImportPath(varIdentifier.getText());
                if (importPath.error !== undefined) {
                    return {
                        error: `identifyValue(identifier='${identifier}',exp='${exp.getText()}')/identifyImportPath(varIdentifier='${varIdentifier}'): ${importPath.error}`
                    }
                } else if (importPath.filePath === undefined) {
                    return {
                        error: `identifyValue(identifier='${identifier}',exp='${exp.getText()}')/identifyImportPath(varIdentifer='${varIdentifier}'): no error, no data`
                    }
                }

                const fileContentData = await fileContentByModulePath(importPath.filePath!);
                if (fileContentData.error !== undefined) {
                    return {
                        error: `identifyValue(identifier='${identifier}',exp='${exp.getText()}')/fileContentByModulePath(importPath.filePath='${importPath.filePath}'): ${fileContentData.error}`
                    }
                } else if (fileContentData.data === undefined) {
                    return {
                        error: `identifyValue(identifier='${identifier}',exp='${exp.getText()}')/fileContentByModulePath(importPath.filePath='${importPath.filePath}'): no error, no data`
                    }
                }

                const subCode = new Code(fileContentData.data!.source!);
                const identified = await subCode.identifyValueByIdentifier(varIdentifier.getText())
                if (identified.error !== undefined) {
                    return {
                        error: `identifyValue(identifier='${identifier}',exp='${exp.getText()}')/subCode.identify(varIdentifier='${varIdentifier.getText()}'): ${identified.error}`
                    }
                } else if (identified.data === undefined) {
                    return {
                        error: `identifyValue(identifier='${identifier}',exp='${exp.getText()}')/subCode.identify(varIdentifier='${varIdentifier.getText()}'): no error, no data`
                    }
                } else if (identified.identity === AstNodeIdentity.Undeclared) {
                    return {
                        error: `subCode.identify(varIdentifier='${varIdentifier.getText()}'): no error, there is data, but node type is not identified`
                    }
                }

                if (identified.identity === AstNodeIdentity.Enum) {
                    let identifiedData = identified.data as EnumMembers;
                    if (propertyIdentifier.getText() in identifiedData) {
                        return {
                            data: identifiedData[propertyIdentifier.getText()] as T
                        }
                    } else {
                        return {
                            error: `The '${identifier}' is identified as property access to the Enum ${varIdentifier}. But this enum doesn't have '${propertyIdentifier.getText()}' member`
                        }
                    }
                } else {
                    console.log(`The identified data is not an enum, then how to use it:`);
                    console.log(identified)
                }
            }
            
            // const propertyValue = (data as any)[propertyIdentifier.getText()]

            // const result = await this.identifyValue<typeof propertyValue>(propertyIdentifier.getText(), propertyValue, rightSide)
            // if (result.error !== undefined) {
            //     return {error: `identifyValue(data=${data}, rightSide=${rightSide.getText}): ${result.error}`}
            // }
            // if (result.data === undefined) {
            //     return {error: `identifyValue(data=${data}, rightSide=${rightSide.getText}): no error, no data, inspect identifyValue`}
            // }

            // (data as any)[propertyIdentifier.getText()] = result.data

            // return {data}
        }
        
        return {error: `identifyValue doesn't support the statement`}
    }

    /**
     * If the variable is updated by a function, then those functions are called by this method.
     * Returns TRUE, if no functions update the variable
     * @param data
     * @returns {error?: string, succeed: boolean}
     * @todo NOT IMPLMENETED
     */
    private identifyVariableUpdateInFunction = <T>(identifier: string, data: T): {error?: string, data?: T} => {
        return {data};
    }


    /**
     * Call the function and return it's result
     * @param {string} funcName function literal
     * @param {any[]} funcArgs function argument
     * @returns {error?: string, data?: T}
     */
    private callFunc = async <T>(funcName: string, funcArgs: any[]): Promise<{error?: string, data?: T}> => {
        
        // Find the function
        const res = this.identifyImportPath<T>(funcName);
        if (res.error !== undefined) {
            return {error: `callFunc:  identifyLiteralInImports(funcName='${funcName}'): ${res.error}`}
        }

        if (res.filePath === undefined) {
            return {error: `callFunc: '${funcName}' module and error are both undefined, check identifyLiteralInImports() and fix it`}
        }

        const moduleRes = await callFuncInModule<T>(res.filePath, funcName, funcArgs);

        return moduleRes;
    }

    /**
     * Does the given ImportDeclaration holds the definition of the literal?
     * @param {string} literal a variable, constant, function to look for 
     * @param astImport the import module declaration
     * @returns {boolean}
     */
    private identifyImportDeclaration = (literal: string): ImportDeclaration|undefined => {
        const astImports = this.ast.getImportDeclarations();

        // Maybe a component is actually defined outside, so its in the imports?
        for (let astImport of astImports) {
            const namedImports = astImport.getNamedImports();
            if (namedImports.length > 0) {
                for (let namedImport of namedImports) {
                    if (namedImport.getText() === literal) {
                        return astImport;
                    }
                }
            }
        
            const namespaceImport = astImport.getNamespaceImport();
            if (namespaceImport !== undefined) {
                console.log(`TODODODODODODO Namespace imports:`)
                console.log(namespaceImport)
            }

            const astAttr = astImport.getAttributes()
            if (astAttr !== undefined) {
                console.log(`TODODODODODODO Import attributes:`)
                console.log(astAttr)
            }

            for (let child of astImport.getChildren()) {
                if (child instanceof JSDoc) {
                    continue;
                }
            
                if (child instanceof ImportClause) {
                    for (let importClauseChild of child.getChildren()) {
                        if (importClauseChild instanceof Identifier && 
                            importClauseChild.getText() === literal) {
                                return astImport;
                        }
                    }
                } 
            }
        }
        return undefined;
    }

    /**
     * 
     * @param literal 
     * @param astImport 
     * @returns 
     */
    private identifyImportPath = <T>(literal: string, astImport?: ImportDeclaration): {error?: string, filePath?: string} => {
        const ret: {
            error?: string,
            filePath?: string,
        } = {}

        if (astImport === undefined) {
            astImport = this.identifyImportDeclaration(literal)
            if (astImport === undefined) {
                return {
                    error: `identifyImportDeclaration(literal=${literal}): not found`
                }
            }
        }

        for (let child of astImport.getChildren()) {
            if (child instanceof StringLiteral) {
                return { filePath: unquote(child.getText()) };
            }
        }
        ret.error = `The ${literal} was not found in the import declarations`

        return ret;
    }

    /**
     * Calls the function and returns its result
     * @param {CallExpression} exp the node with the function call
     * @returns {error?: string, data?: T}
     */
    private identifyFunctionCall = async <T>(exp: CallExpression): Promise<{error?: string, data?: T}> => {
        const ret: {
            error?: string,
            data?: T,
        } = {}

        if (exp === undefined) {
            return {error: `Expression passed to getCallExpression is undefined`}
        } else if (exp.getChildCount() < 3) {
            return {error: `The expression passed to getCallExpression misses child nodes`};
        }

        const identifier = exp.getChildAtIndex(0) as Identifier;
        if (identifier === undefined) {
            return {error: `The first node of call epxression passed to getCallExpression is not an identifier`}
        }
        const funcName = identifier.getText();
        const funcArgs: any[] = [];
        let openParenthesis: boolean = false;
        let closeParenthesis: boolean = false;
        for (let i = 1; i < exp.getChildCount(); i++) {
            const subChild = exp.getChildAtIndex(i);
            if (subChild.getText() === "(") {
                openParenthesis = true;
            } else if (subChild.getText() === ")") {
                closeParenthesis = true;
            } else if (!(subChild instanceof SyntaxList) || subChild.getText() !== "") {
                if (openParenthesis === false) {
                    continue;
                }
                if (subChild instanceof SyntaxList) {
                    for (let funcArg of subChild.getChildren()) {
                        if (funcArg.getText() === ",") {
                            continue;
                        }
                        let result = await this.identifyValue(funcArg.getText(), {}, funcArg);
                        if (result.error !== undefined) {
                            return {
                                error: `identify one of many function argument by calling identifyValue(funcArg='${funcArg.getText()}'): ${result.error}`
                            }
                        } else if (result.data === undefined) {
                            return {
                                error: `identify one of many function argument by calling identifyValue(funcArg='${funcArg.getText()}'): no error, no data`
                            }
                        } else {
                            funcArgs.push(result.data)
                        }
                    }
                } else {
                    let result = await this.identifyValue(subChild.getText(), {}, subChild);
                    if (result.error !== undefined) {
                        return {
                            error: `identify the function argument by calling identifyValue(subChild='${subChild.getText()}'): ${result.error}`
                        }
                    } else if (result.data === undefined) {
                        return {
                            error: `identify the function argument by calling identifyValue(subChild='${subChild.getText()}'): no error, no data`
                        }
                    } else {
                        funcArgs.push(result.data)
                    }
                }
            }
        }

        if (closeParenthesis === false) {
            return {error: `Failed to find close parenthessis of ${funcName} call in '${exp.getText()}'`}
        }
        if (ret.error !== undefined) {
            return {error: `The identifying the function call throw an error: ${ret.error}`}
        } 

        return await this.callFunc<T>(funcName, funcArgs);
    }

    private identifyVariableDeclaration = (identifier: string): {error?: string, varDeclaration?: VariableDeclaration} => {
        const varDeclaration = this.ast.getVariableDeclaration(identifier);
        if (varDeclaration === undefined) {
            return {
                error: `The '${identifier}' variable's declaration not found in the AST`
            };
        }

        return {varDeclaration}
    }

    /**
     * Given the argument, its the variable name, find the line where this variable was declared and
     * get its value.
     * @param {string} varLiteral the variable name
     * @returns {error?: string, data?: T}
     * @todo Make sure to identify the variable update after the assignment
     * @todo Make sure to identify the variable update after function call (function maybe updating it)
     */
    private identifyVariable = async <T>(identifier: string): Promise<{error?: string, data?: T}> => {
        const ret: {error?: string, data?: T} = {}

        // If Attribute name is an identifier, get variable statements that define them:
        // For example `const v: number = 1`
        const varDeclaration = this.identifyVariableDeclaration(identifier);
        if (varDeclaration.error !== undefined) {
            return {
                error: `identifyVariableDeclaration(identifier=${identifier}): ${varDeclaration.error}`
            };
        }

        const identifiedValue = await this.identifyVariableValue<T>(varDeclaration!.varDeclaration!.getChildren());
        if (identifiedValue.error !== undefined) {
            return {
                error: `identifyVariableValue(varDeclaration(identifier=${identifier})): ${identifiedValue.error}`
            }
        }
        if (identifiedValue.data === undefined) {
            return {
                error: `identifyVariableValue(varDeclaration(identifier=${identifier})): no error, no data`
            }
        }

        const updated = await this.identifyVariableUpdates<T>(identifier, identifiedValue.data!);
        if (updated.error !== undefined) {
            return {error: `identifyVariableUpdates(identifier=${identifier},variable.data=${identifiedValue.data}): ${updated.error}`}
        }

        return updated;
    }

    /**
     * Identify the variable's value (the right side and return it as T)
     * @param {any[]} children list of Import Declaration's AST nodes
     * @returns {error?: string, data?: T}
     */
    private identifyVariableValue = async <T>(children: any[]): Promise<{error?: string, data?: T}> => {
        const ret: {error?: string, data?: T} = {}

        /**
         * Identify the value of the variable declaration.
         * The first child is the variable itself, so we skip it.
         */
        for (let i = 1; i < children.length; i++) {
            const child = children[i];
            // In variable declaration, some nodes are not part of the var, lets skip them
            if (child.getText().indexOf('=') > -1 || 
                child.getText() === ":" || 
                child instanceof TypeReferenceNode) {
                continue;
            }

            if (child instanceof CallExpression) {
                // The value clause is the function call? `foo()` will be turned into four nodes:
                // 1: Identifier(foo), 
                // 2: Node(\(), 
                // 3: SyntaxList(""), 
                // 4: Node(\))
                const exprResult = await this.identifyFunctionCall<T>(child as CallExpression);
                return exprResult;
            } else if (child instanceof Identifier) {
                return await this.identifyVariable<T>(child.getText());
            } else if (child instanceof StringLiteral) {
                ret.data = unquote(child.getText()) as T;
                ret.error = undefined;
                return ret;
            } else {
                ret.error = `The variable value ${JSON.stringify(child.getText())} type variable's value side is not handled. Change identifyVariableDeclaration() to fix it`
                console.log(child);
                return ret;
            }
        }

        ret.error = `Couldn't find any expected AST component to consider as the variable's value`

        return ret;
    }

}
