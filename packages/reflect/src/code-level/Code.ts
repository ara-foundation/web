/**
 * The script that works with the code by turning it into the 
 * AST (Abstract Syntax Tree)
 * @todo Make the components nested to each other
 * @todo fix the parsing of all pages
 * @todo somehow we need to show on PageModal the meta components
 */
import { 
    CallExpression,
    Identifier, 
    ImportClause, 
    JSDoc, 
    Project, 
    SourceFile as TsSourceFile, 
    StringLiteral, 
    VariableDeclarationKind,
    SyntaxList,
    ImportDeclaration as TsImportDeclaration,
    ExpressionStatement,
    BinaryExpression,
    ObjectLiteralExpression,
    SpreadAssignment,
    PropertyAssignment,
    VariableDeclaration,
    ArrayLiteralExpression,
    PropertyAccessExpression,
    EnumMember,
    NumericLiteral,
    ShorthandPropertyAssignment,
    CommentStatement,
    VariableStatement,
    ParenthesizedExpression,
    ConditionalExpression,
    PrefixUnaryExpression,
    Node,
} from "ts-morph";
import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import { StringTraits, Result, Debug } from "@ara-web/ts-enhancement";
import { callFuncInModule } from "../fileLevel.js";
import { ImportDeclaration } from "./import-declaration.js";
import { defineVariableDeclaration } from "./variable.js";
import { ValueTypeString, type ValueType, type IdentifiedNodeDataType, AstNode, type AstIdentifiers, AstNodeType, type TypeDeclaration as TypeDeclarationData, type EnumMembers } from "./ast-node.js";
import { deepCopy } from "@ara-web/ts-enhancement";
import { ReflectAraLink } from "../araLink/ReflectAraLink.js";
import { ModuleMemory } from "../memory/ModuleMemory.js";
import type { ProjectMemory } from "../memory/ProjectMemory.js";
import { TypeDeclaration } from "./type-declaration.js";
import { TsNode, type TsNodeValidator } from "./ts-node.js";

export type Object = {[key: string]: ValueType};


export class Code {
    private _ast: TsSourceFile;
    code: string;
    project: Project;
    tempCodeAmount: number;

    /********************************************************/

    /**
     * Convert the source code into the AST tree
     * @param source the typescript code
     */
    constructor(code: string, tempCodeAmount = 0) {
        this.tempCodeAmount = tempCodeAmount;
        this.code = code;
        this.project = new Project({
            useInMemoryFileSystem: true
        })
        
        this._ast = this.project.createSourceFile(`__temp.ts`, code);
    }

    /**
     * Gets from AST all children.
     * Node, that AST's children at the root level are list of code pieces.
     * Instead parsing at the AST level, we check in the sub child level.
     * @param filters
     * @returns 
     */
    private getTsNodes = (filters?: TsNodeValidator[]): TsNode[] => {
        const nodes: TsNode[] = [];
        for (let child of this._ast.getChildren()) {
            const children = new TsNode(child).getChildren(filters);
            
            nodes.push(...children)
        }

        return nodes;
    
    }

    /**
     * Clone the Code with the new AST.
     * Used to evaluate various attributes by manipulating AST itself.
     * @returns {Code}
     */
    private clone = (): this => {
        const cloned = new (this.constructor as typeof Code)(this.code, this.tempCodeAmount) as this;
        return cloned;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Import Declarations
    //
    /////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Parses the entire code for any import clauses. If any import clause,
     * then, using `./import-declarations.ts` will turn them into the import identifiers.
     * 
     * This is the first function called by Reflect.
     * @returns AstIdentifiers
     */
    public getImportedIdentifiers = (): Result<AstIdentifiers> => {
        let identifiers: AstIdentifiers = {};
        const tsNodes = this.getTsNodes([ImportDeclaration.isImportDeclaration])

        for (let tsNode of tsNodes) {
            const importDeclaration = ImportDeclaration.fromTsNode(tsNode);
            
            if (importDeclaration.isFailure) {
                return Result.fail(
                    `ImportDeclaration.fromTsNode(tsNode: '${tsNode.getText()}'): ${importDeclaration.errorTitle}`,
                    importDeclaration.errorDescription!
                )
            }
        
            const importIdentifiers = importDeclaration.getValue().getIdentifiers();
            if (importIdentifiers.isFailure) {
                return Result.fail(
                    `importDeclaration.getIdentifiers('${tsNode.getText()}'): ${importIdentifiers.errorTitle}`,
                    importIdentifiers.errorDescription!
                )
            }
            identifiers = {...identifiers, ...importIdentifiers.getValue()};
        }

        return Result.ok(identifiers);
    }

    /**
     * Lint dependencies of the given module identified by type and path.
     * 
     * Fetches the import identifiers, and passes them into the lintImportedIdentifiers().
     * @param moduleMemory 
     * @param projectMemory {Lint from all modules}
     * @returns 
     */
    public getLintedImportIdentifiers = async <T>(moduleMemory: ModuleMemory<T>, projectMemory: ProjectMemory): Promise<Result<AstIdentifiers>> => {
        const identifiers  = moduleMemory.getIdentifiers([AstNode.isDefinedInOtherModule])

        const importIdentifiersCount = Object.keys(identifiers).length;
        if (importIdentifiersCount == 0) {
            return Result.ok(identifiers);
        }

        for (let identifier in identifiers) {
            let node = identifiers[identifier];

            if (node instanceof AraLink) {
                const refNode = moduleMemory.identifierByAraLink(node)
                if (refNode === undefined) {
                    return Result.fail(
                        `'${identifier}' is alias, but it's referenced data not found`
                    )
                }
                node = refNode;
            }

            // Debug.push(`this.identifyImportedIdentifier()`, {'identifiedNode': node.identifier!})
            const identifiedValue = await this.identifyImportedIdentifier(node, projectMemory)
            // Debug.pop();
            if (identifiedValue.isFailure) {
                return Result.fail(
                    `identifyImportedIdentifier(identifier='${identifier}'): ${identifiedValue.errorTitle}`,
                    identifiedValue.errorDescription!
                )
            }
            if (identifiedValue.getValue().data === undefined) {
                const err = Debug.error(
                    `The import identifier '${identifier}' of '${node.nodeType}' node type data couldn't be identified`,
                    `Update the lintImportedIndetifiers() to supported it, since the data returned as undefined`,
                    {node, identifiedValue},
                )
                return Result.fail(err)
            }
            
            identifiers[identifier] = identifiedValue.getValue();
        }

        return Result.ok(identifiers);
    }

    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Type Declarations
    //
    /////////////////////////////////////////////////////////////////////////////////////////////

    public getLintedTypeIdentifiers = async <T>(memory: ModuleMemory<T>, memories: ProjectMemory): Promise<Result<AstIdentifiers>> => {
        const localTypeFilters = [
            AstNode.isDefinedInLocal, 
            AstNode.isTypeDeclaration,
            AstNode.dataIsNonEmptyObject
        ]
        const identifiers  = memory.getIdentifiers(localTypeFilters)
        const importIdentifiersCount = Object.keys(identifiers).length;
        if (importIdentifiersCount == 0) {
            return Result.ok(identifiers);
        }

        return Result.fail(`Not implemented`, 'Make sure lintedTypeIdentifiers() works in Code class by ucommenting body')
        // for (let identifier in identifiers) {
        //     let node = identifiers[identifier];
            
        //     if (node instanceof AraLink) {
        //         // const refNode = memory.identifierByAraLink(node)
        //         // if (refNode === undefined) {
        //         //     return Result.fail(
        //         //         `'${identifier}' is alias, but it's referenced data not found`
        //         //     )
        //         // }
        //         // node = refNode;
        //         return Result.fail(`Not implemented`, `getLintedTypeIdentifiers() to support referenced types`);
        //     }
        //     Debug.log(`TODO change identifyImportedIdentifier()`);
        //     Debug.log(`The type identifier: '${identifier}' data:`);
        //     if (node.memoryDataLength() > 0) {
        //         Debug.log(`TODO The node has memory data, update them.`);
        //         Debug.log(node)
        //     }
        //     const astNode = node as AstNode;

        //     for (let typeProperty in astNode.data!) {
        //         if (data[typeProperty] instanceof AraLink) {
        //             if (!ReflectAraLink.isIdentifierLink(data[typeProperty] as AraLink<string>)) {
        //                 return Result.fail(
        //                     `isAraIdentifierLink(araLink='${JSON.stringify(data[typeProperty])}') is not a link to identifier`,
        //                     `Only support the ara identifiers for now, update the lintTypeDeclarations()`
        //                 )
        //             }

        //             const typeNode = memory.identifierByAraLink(data[typeProperty] as AraLink<string>);
        //             if (typeNode === undefined) {
        //                 return Result.fail(
        //                     `identifierByAraLink(araLink='${JSON.stringify(data[typeProperty])}') is not in the AST memory`,
        //                     `Only support the ara identifiers for now, update the lintTypeDeclarations()`
        //                 ) 
        //             }

        //             data[typeProperty] = typeNode.data!;
        //     }
        //     }

        //     /// OLD COde taken from the linting import declarations

        //     // Debug.push(`this.identifyImportedIdentifier()`, {'identifiedNode': node.identifier!})
        //     const identifiedValue = await this.identifyImportedIdentifier(node, memories)
        //     // Debug.pop();
        //     if (identifiedValue.isFailure) {
        //         return Result.fail(
        //             `identifyImportedIdentifier(identifier='${identifier}'): ${identifiedValue.errorTitle}`,
        //             identifiedValue.errorDescription!
        //         )
        //     }
        //     if (identifiedValue.getValue().data === undefined) {
        //         const err = Debug.error(
        //             `The import identifier '${identifier}' of '${node.nodeType}' node type data couldn't be identified`,
        //             `Update the lintImportedIndetifiers() to supported it, since the data returned as undefined`,
        //             {node, identifiedValue},
        //         )
        //         return Result.fail(err)
        //     }
            
        //     identifiers[identifier] = identifiedValue.getValue();
        // }

        // return Result.ok(identifiers);
    }

    /**
     * Returns all the types defined in this code.
     * @param memory 
     * @returns 
     */
    public getTypeIdentifiers = (): Result<AstIdentifiers> => {
        let identifiers: AstIdentifiers = {};
        
        const tsNodes = this.getTsNodes([TypeDeclaration.isTypeDeclaration]);
        for (let tsNode of tsNodes) {
            const typeDeclaration = TypeDeclaration.fromTsNode(tsNode);
            if (typeDeclaration.isFailure) {
                return Result.fail(
                    `TypeDeclaration.fromTsNode(tsNode: '${tsNode.getText()}'): ${typeDeclaration.errorTitle}`,
                    typeDeclaration.errorDescription!
                )
            }

            // Debug.push(`typeDeclarationToAstIdentifier()`, {'astImport': typeDeclaration.tsNode.getText()})
            const identifiedTypeDeclaration = typeDeclaration.getValue().getAstNode();
            // Debug.pop();
            if (identifiedTypeDeclaration.isFailure) {
                return Result.fail(
                    `typeDeclarationToAstIdentifier(astImport='${typeDeclaration.getValue().getText()}'): ${identifiedTypeDeclaration.errorTitle}`,
                    identifiedTypeDeclaration.errorDescription!
                )
            }
            identifiers[identifiedTypeDeclaration.getValue().identifier!] = identifiedTypeDeclaration.getValue();
        }
        return Result.ok(identifiers);
    }

    /**
     * If the types refer to another types, then replace them with {}
     * @limitation Only works with the first keys of the TypeDeclaration, the node's type must be TypeDeclaration.
     * To make any nested objects, update the lintTypeDeclarations().
     * @param memory 
     * @returns 
     */
    private lintTypeDeclarations = async <T>(memory: ModuleMemory<T>): Promise<Result<undefined>> => {
        const typeIdentifiers = memory.getIdentifiers([AstNode.isDefinedInLocal, AstNode.isTypeDeclaration])
        const typeIdentifiersCount = Object.keys(typeIdentifiers).length;
        for (let typeIdentifier in typeIdentifiers) {
            const astNode = typeIdentifiers[typeIdentifier] as AstNode;

            return Result.fail(`Not implemented`, 'update lintTypeDeclarations()');
            // for (let typeProperty in astNode.data) {
            //     if (data[typeProperty] instanceof AraLink) {
            //         if (!ReflectAraLink.isIdentifierLink(data[typeProperty] as AraLink<string>)) {
            //             return Result.fail(
            //                 `isAraIdentifierLink(araLink='${JSON.stringify(data[typeProperty])}') is not a link to identifier`,
            //                 `Only support the ara identifiers for now, update the lintTypeDeclarations()`
            //             )
            //         }

            //         const typeNode = memory.identifierByAraLink(data[typeProperty] as AraLink<string>);
            //         if (typeNode === undefined) {
            //             return Result.fail(
            //                 `identifierByAraLink(araLink='${JSON.stringify(data[typeProperty])}') is not in the AST memory`,
            //                 `Only support the ara identifiers for now, update the lintTypeDeclarations()`
            //             ) 
            //         }

            //         data[typeProperty] = typeNode.data!;
            // }
            //}
        }

        return Result.ok(undefined);
    }

    private defineVariableDeclarations = <T>(memory: ProjectMemory): Result<AstIdentifiers> => {
        let identifiers: AstIdentifiers = {};
        for (let child of this._ast.getChildren()) {
            for (let i = 0; i < child.getChildCount(); i++) {
                const subChild = child.getChildAtIndex(i)
                // Get All Variable Statements from the code's AST
                if (!(subChild instanceof VariableStatement)) {
                    continue;
                }
                // Debug.push('defineVariableDeclaration()', {'varStatement': subChild.getText()})
                const identified = defineVariableDeclaration(subChild, memory);
                // Debug.pop();
                if (identified.isFailure) {
                    return Result.fail(
                        `this.defineVariableDeclaration(varStatement='${subChild.getText()}'): ${identified.errorTitle}`,
                        identified.errorDescription!
                    )
                }
                identifiers = {...identifiers, ...identified.getValue()}
            }
        }

        return Result.ok(identifiers);
    }


    private lintVariables = async <T>(memory: ModuleMemory<T>): Promise<Result<undefined>> => {
        const varIdentifiers = memory.identifiersByType(AstNodeType.Variable)
        const varIdentifiersCount = varIdentifiers.length;
        Debug.log(`Lint '${varIdentifiersCount}' variable identifiers`);
        for (let varIdentifierIndex = 0; varIdentifierIndex < varIdentifiersCount; varIdentifierIndex++) {
            const varIdentifier = varIdentifiers[varIdentifierIndex];
            if (varIdentifier.identifier !== "tokens") {
                continue;
            }
            // if (varIdentifier.identifier !== "layoutProps") { // The layoutProps value is Object with Nested object
            //     continue;
            // }
            Debug.log(`Linting the 'tokens: Token[]' variable`)
            Debug.log(varIdentifier)
            if (AstNode.isDefinedInOtherModule(varIdentifier)) {
                continue;
            }

            if (varIdentifier.identifier === undefined) {
                return Result.fail(
                    `The var identifier's identifier property in the node is undefined`,
                    `Ara Web must know the identifier, please update the function that passes varIdentifier to include identifier property`
                )                    
            }
            const identifier = varIdentifier.identifier;
            
            if (varIdentifier.data === undefined) {
                Debug.log(`TODO: var '${identifier}' identifier's data is undefined, use this.identiferVariable`);
                Debug.log(`Ara Web doesn't support it yet`)
                Debug.log(varIdentifier)
                return Result.fail(
                    `TODO: var '${identifier}' identifier's data is undefined, use this.identiferVariable`,
                    `Ara Web doesn't support it yet`
                )
            }
            if (!(varIdentifier.data instanceof AraLink)) {
                Debug.log(`The var '${identifier}' is not AraLink, update lintVariables() to support the data:`)
                Debug.log(varIdentifier.data);
                Debug.log(varIdentifier)
                return Result.fail(
                    `The var '${identifier}' data unsupport type`,
                    `Ara Web supports AraLinks for now, update lintVariables() to support it`
                )
            }

            if (!ReflectAraLink.isExpressionLink(varIdentifier.data as AraLink<Node>)) {
                Debug.log(varIdentifier.data)
                    return Result.fail(
                    `The data is an Ara Link, but Ara Web supports Link to the Expressions only`,
                    `update the lintVariables() to use data link ${varIdentifier.data.toString()}`
                )   
            }

            Debug.push(`identifyDataType()`, {'dataType': varIdentifier.dataType!.toString(), data: varIdentifier.data.toString()})
            const childValueType = this.identifyDataType(varIdentifier.dataType!, varIdentifier.data, memory);
            Debug.pop()
            Debug.log(`Data type identified`)
            Debug.log(childValueType)

            if (childValueType.isFailure) {
                return Result.fail(
                    `this.identifyDataType(dataType: '${varIdentifier.dataType!.toString()}', data: '${varIdentifier.data.toString()}'): ${childValueType.errorTitle}`,
                    childValueType.errorDescription!
                )
            }

            let sampleIdentifierValue: any = {};
            if (Object.values(ValueTypeString).includes(childValueType.getValue())) {
            Debug.log(`The sample identifier by the enum type`)
                sampleIdentifierValue = this.emptyValueByType(identifier, childValueType.getValue())
            } else {
            Debug.log(`The sample identifier by the custom type`)
                sampleIdentifierValue = childValueType.getValue() as any;
            }
            const exp = varIdentifier.data.resource;
            Debug.log(`The sample identifier by the type`)
            Debug.log(sampleIdentifierValue)
            Debug.log(`First, lint the data types by the variables`);

            Debug.push(`this.identifyValue()`, {'identifier': identifier, 'data': JSON.stringify(sampleIdentifierValue), 'exp': (exp as Node).getText()})
            const identifiedValue = await this.identifyValue(identifier, sampleIdentifierValue, childValueType.getValue(), exp as Node, memory);
            Debug.pop();
            Debug.log(`The '${identifier}' identified value = '${identifiedValue}'`)
            Debug.log(identifiedValue)
            if (identifiedValue.isFailure) {
                return Result.fail(
                    `identifyVariable(identifier='${identifier}'): ${identifiedValue.errorTitle}`,
                    identifiedValue.errorDescription!
                )
            }
        }
        return Result.ok()
    }

    /**
     * Identify the variable values
     * @param memory 
     * @returns 
     */
    private identifyVariableValues = async <T>(memory: ModuleMemory<T>): Promise<Result<undefined>> => {
        const varIdentifiers = memory.identifiersByType(AstNodeType.Variable)
        const varIdentifiersCount = varIdentifiers.length;
        Debug.log(`Lint '${varIdentifiersCount}' variable identifiers`);
        for (let varIdentifierIndex = 0; varIdentifierIndex < varIdentifiersCount; varIdentifierIndex++) {
            const varIdentifier = varIdentifiers[varIdentifierIndex];

            if (varIdentifier.identifier === undefined) {
                return Result.fail(
                    `The var identifier's identifier property in the node is undefined`,
                    `Ara Web must know the identifier, please update the function that passes varIdentifier to include identifier property`
                )                    
            }
            const identifier = varIdentifier.identifier;

            if (identifier === "tokens") {
                continue;
            }
            if (identifier !== "layoutProps") { // The layoutProps value is Object with Nested object
                continue;
            }
            Debug.log(`Linting the 'layoutProps' variable`)
            Debug.log(varIdentifier)
            
            if (varIdentifier.data === undefined) {
                Debug.log(`TODO: var '${identifier}' identifier's data is undefined, use this.identiferVariable`);
                Debug.log(`Ara Web doesn't support it yet`)
                Debug.log(varIdentifier)
                return Result.fail(
                    `TODO: var '${identifier}' identifier's data is undefined, use this.identiferVariable`,
                    `Ara Web doesn't support it yet`
                )
            }

            if (!(varIdentifier.data instanceof AraLink)) {
                Debug.log(`The var '${identifier}' is not AraLink, update lintVariables() to support the data:`)
                Debug.log(varIdentifier.data);
                Debug.log(varIdentifier)
                return Result.fail(
                    `The var '${identifier}' data unsupport type`,
                    `Ara Web supports AraLinks for now, update lintVariables() to support it`
                )
            }

            // And the data can be only an expression
            if (!ReflectAraLink.isExpressionLink(varIdentifier.data as AraLink<Node>)) {
                Debug.log(varIdentifier.data)
                    return Result.fail(
                    `The data is an Ara Link, but Ara Web supports Link to the Expressions only`,
                    `update the lintVariables() to use data link ${varIdentifier.data.toString()}`
                )   
            }


            Debug.push(`identifyDataType()`, {'dataType': varIdentifier.dataType!.toString(), data: varIdentifier.data.toString()})
            const childValueType = this.identifyDataType(varIdentifier.dataType!, varIdentifier.data, memory);
            Debug.pop()
            Debug.log(`Data type identified`)
            Debug.log(childValueType)

            if (childValueType.isFailure) {
                return Result.fail(
                    `this.identifyDataType(dataType: '${varIdentifier.dataType!.toString()}', data: '${varIdentifier.data.toString()}'): ${childValueType.errorTitle}`,
                    childValueType.errorDescription!
                )
            }

            const exp = varIdentifier.data.resource as Node;
            Debug.log(`The sample identifier by the type`)
            let sampleIdentifierValue = this.emptyValueByType(identifier, childValueType.getValue())
            if (sampleIdentifierValue.isFailure) {
                const err = Debug.error(
                    `this.exactValueType(): ${sampleIdentifierValue.errorTitle}`,
                    sampleIdentifierValue.errorDescription!,
                    {identifier, val: childValueType, data: {}}
                )
                return Result.fail(err);
            }
            Debug.log(sampleIdentifierValue)

            Debug.push(`this.identifyValue()`, {'identifier': identifier, 'data': JSON.stringify(sampleIdentifierValue.getValue()), dataType: JSON.stringify(childValueType.getValue()), 'exp': (exp as Node).getText()})
            const identifiedValue = await this.identifyValue(identifier, sampleIdentifierValue.getValue(), childValueType.getValue(), exp, memory);
            Debug.pop();
            Debug.log(`The '${identifier}' identified value = '${identifiedValue}'`)
            Debug.log(identifiedValue)
            if (identifiedValue.isFailure) {
                return Result.fail(
                    `identifyVariable(identifier='${identifier}'): ${identifiedValue.errorTitle}`,
                    identifiedValue.errorDescription!
                )
            }

            varIdentifiers[varIdentifierIndex].data = identifiedValue.getValue();
            varIdentifiers[varIdentifierIndex].dataType = childValueType.getValue();
        }
        return Result.ok()
    }

    /**
     * Find the result of the expression, by setting it as a variable declaration.
     * @param {string} exp a JS doc that after evaluating gives the result
     * @returns {T} the result of the expression
     */
    public identifyCodePiece = async <T>(exp: string): Promise<Result<T>> => {
        this.tempCodeAmount++;
        const varName = `__temp_var_${this.tempCodeAmount}`;
        let cloned = this.clone();
        cloned._ast.addVariableStatement({
            declarationKind: VariableDeclarationKind.Const, // defaults to "let"
            declarations: [{
              name: varName,
              type: "string",
              initializer: exp,
            }],
        });
        return Result.fail(`stopped`, 'testing the addition of memory')

        // Debug.push(`identifyCodePiece`)
        // Debug.log(`Entry from other module into code level.`)
        // Debug.log(`Identify '${exp}' expression, then assign to '${varName}' temporary variable.`)

        // Debug.push(`identifyVariable(varName='${varName}', update=false)`)
        // // It may be not only identifier so clone and put it in the ast
        // var variable = await cloned.identifyVariable<T>(varName, false);
        // Debug.pop()
        // Debug.log(`${varName} identified value = ${JSON.stringify(variable)}.`)
        // // Once the _ara_web_exp is turned into the statement, get it's value.
        // Debug.pop();
        // Debug.reset();

        // if (variable.isFailure) {
        //     return Result.fail(
        //         `cloned.identifyVariable(varName=${varName}): ${variable.errorTitle}`,
        //         variable.errorDescription!
        //     )
        // }

        // return Result.ok(variable.getValue() as T)
    }

    /**
     * Variables values might be updated by assignment or by passing to the functions
     */
    private identifyVariableUpdates = async <T>(identifier: string, data: ValueType|undefined, dataType: ValueTypeString|ValueType, memory: ModuleMemory<T>): Promise<Result<ValueType>> => {
        const updatedInFunction = this.identifyVariableUpdateInFunction(identifier, data, dataType);
        if (updatedInFunction.isFailure) {
            return Result.fail(
                `this.identifyVariableUpdateInFunction(identifier=${identifier}, data=${data}): ${updatedInFunction.errorTitle}`,
                updatedInFunction.errorDescription!
            )
        }

        Debug.push(`identifyVariableAssingments(identifier='${identifier}', updatedInFunction='${JSON.stringify(updatedInFunction.getValue())}')`)
        const updatedInAssignment = await this.identifyVariableAssignments(identifier, updatedInFunction.getValue(), typeof updatedInFunction.getValue() as ValueTypeString, memory);
        Debug.pop();
        Debug.log(`identify variable assignments for ${identifier} result = '${JSON.stringify(updatedInAssignment)}'`)
        if (updatedInAssignment.isFailure) {
            return Result.fail(
                `this.identifyVariableAssignments(identifier=${identifier}, updatedFunctionData=${updatedInFunction.getValue()}): ${updatedInAssignment.errorTitle}`,
                updatedInAssignment.errorDescription!
            )
        }

        return Result.ok(updatedInAssignment.getValue());
    }

    /**
     * If the variable or variable's properties are updated, then this method will apply those changes.
     * Returns TRUE, if no assignments were found
     * @param data
     * @returns {error?: string, succeed: boolean}
     * @notice It won't return an error
     */
    private identifyVariableAssignments = async <T>(identifier: string, data: ValueType|undefined, dataType: ValueTypeString|ValueType, memory: ModuleMemory<T>): Promise<Result<ValueType>> => {
        let ret: Result<ValueType> = Result.ok(data)

        // To make it variable assignment, make sure we track ExpressionStatements and BinaryExpressions
        for (let child of this._ast.getChildren()) {
            const childAmount = child.getChildCount()
            Debug.log(`There are '${childAmount}' expressions`)
            for (let subChild of child.getChildren()) {
                if (subChild instanceof ExpressionStatement) {
                    Debug.push(`expressionStatement(identifier='${identifier}',data='${JSON.stringify(data)}',subChild='${subChild.getText()}')`);
                    const res = await this.identifyExpressionStatement(identifier, data, dataType, subChild, memory)
                    Debug.pop();
                    if (res.isFailure) {
                        return Result.fail(
                            `identifyExpressionStatement(identifier=${identifier}, data=${data}, child=${subChild.getText()}): ${res.errorTitle}`,
                            res.errorDescription!
                        )
                    } else {
                        return Result.ok(res.getValue())
                    }
                } else if (subChild instanceof BinaryExpression) {
                    const res = await this.identifyBinaryExpression(identifier, data, dataType, subChild, memory)
                    if (res.isFailure) {
                        return Result.fail(
                            `identifyBinaryExpression(identifier=${identifier}, data=${data}, child=${subChild.getText()}): ${res.errorTitle}`,
                            res.errorDescription!
                        )
                    } else {
                        return Result.ok(res.getValue())
                    }
                } else if (subChild instanceof ImportDeclaration) {
                    continue;
                } else if (subChild instanceof CommentStatement) {
                    continue;
                } else if (subChild instanceof VariableStatement) {
                    continue;
                } else {
                    Debug.log(`Unsupported expression statement ('${subChild.getText()}'):`)
                    Debug.log(subChild)
                }
            }
        }

        return Result.ok(data);
    }

    private identifyExpressionStatement = async<T>(identifier: string, data: ValueType|undefined, dataType: ValueTypeString|ValueType, exp: ExpressionStatement, memory: ModuleMemory<T>): Promise<Result<ValueType>> => {
        for (let child of exp.getChildren()) {
            if (child instanceof BinaryExpression) {
                const res = await this.identifyBinaryExpression(identifier, data, dataType, child, memory);
                if (res.isFailure) {
                    return Result.fail(
                        `identifyBinaryExpression(identifier='${identifier}', data='${JSON.stringify(data)}', child='${child.getText()}'): ${res.errorTitle}`,
                        res.errorDescription!
                    )
                }
                return Result.ok(res.getValue());
            } else if (child instanceof CallExpression) {
                Debug.log(`TODO: The call expression '${child.getText()}' not yet supported in identifyExpressionStatement`);
                return Result.ok(data);
            } else {
                Debug.log(`identifyExpressionStatement only supports BinaryExpressions for now. You gave:`);
                Debug.log(`Value='${child.getText()}'`);
                Debug.log(child)
                Debug.log(`\n\n`);
            }
        }

        return Result.fail(
            `Unsupported expression statement`,
            `Only Binary Expression is supported, the '${exp.getText()}' is not a binary expression`
        )
    }

    private identifyBinaryExpression = async <T>(identifier: string, data: ValueType|undefined, dataType: ValueTypeString|ValueType, exp: BinaryExpression, memory: ModuleMemory<T>): Promise<Result<ValueType>> => {
        const leftSide = exp.getChildAtIndex(0);
        const rightSide = exp.getChildAtIndex(2);
    
        if (leftSide instanceof Identifier) {
            if (leftSide.getText() !== identifier) {
                return Result.ok(data);
            }
            const result = await this.identifyValue(identifier, data, dataType, rightSide, memory)
            if (result.isFailure) {
                return Result.fail(
                    `leftSide('${leftSide.getText()}') as Identifier: this.identifyValue(identifier='${identifier}', data='${JSON.stringify(data)}', rightSide='${rightSide.getText()}'): ${result.errorTitle}`,
                    result.errorDescription!
                )
            }
            return Result.ok(result.getValue());
        } else if (leftSide instanceof PropertyAccessExpression) {
            const varIdentifier = leftSide.getChildAtIndex(0);
            const propertyIdentifier = leftSide.getChildAtIndex(2);
            if (varIdentifier.getText() !== identifier) {
                return Result.ok(data);
            }

            const propertyValue = (data as any)[propertyIdentifier.getText()]

            const result = await this.identifyValue(propertyIdentifier.getText(), propertyValue, propertyValue, rightSide, memory)
            if (result.isFailure) {
                return Result.fail(
                    `leftSide('${leftSide.getText()}') as PropertyAccessExpression: this.identifyValue(propertyIdentifier='${propertyIdentifier}', propertyValue='${JSON.stringify(propertyValue)}', rightSide='${rightSide.getText()}'): ${result.errorTitle}`,
                    result.errorDescription!
                )
            }

            (data as any)[propertyIdentifier.getText()] = result.getValue()

            return Result.ok(data);
        } else {
            Debug.log(`identifyBinaryExpression ts='${exp.getText()}' has ${exp.getChildCount()} nodes, let's begin (NOT SUPPORTED)..`);
            Debug.log(`Left='${leftSide.getText()}'`);
            Debug.log(JSON.stringify(leftSide))
            Debug.log(`Right=${rightSide.getText()}`);
            Debug.log(JSON.stringify(rightSide));
            Debug.log(`\identifyBinaryExpression end`);
            return Result.fail(
                `Unsupported left side of the binary`,
                `Only Identifier or PropertyAccess are supported for now for '${leftSide.getText()}=${rightSide.getText()}'`
            )
        }
    }

    /**
     * If the node type is a Type, then it simply sets the {} empty object and leaves as it is.
     * 
     * Otherwise, for all others, it will get the glob data and put it on the import.
     * @param identifiedNode 
     * @requires identifiedNode.identifier
     * @requires idenfifiedNode.importPath
     * @limitation Make sure identifiedNode passes the AstNode.isDefinedInOtherModule() before calling this function.
     * @returns 
     */
    private identifyImportedIdentifier = async(identifiedNode: AstNode, memory: ProjectMemory): Promise<Result<AstNode>> => {
        if (identifiedNode.identifier === undefined) {
            return Result.fail(
                `The identifier property is missing`,
                `Set the identifier property before calling identifyImportedIdentifier()`,
            )
        }

        if (identifiedNode.nodeType === AstNodeType.Type) {
            identifiedNode.importPath = undefined;
            identifiedNode.data = {};
            return Result.ok(identifiedNode);
        }

        const modulePath = identifiedNode.getImportModulePath();
        if (modulePath === undefined) {
            return Result.fail(
                `getImportModulePath(): '${identifiedNode.identifier}' module path is not found`,
                `Make sure this node is import node, or fix AstNode.getImportModulePath()`
            )
        }

        // Debug.push(`memory.identifyModuleByPath()`, {modulePath})
        const identifiedMemory = memory.identifyModuleByPath(modulePath);
        // Debug.pop();
        if (identifiedMemory.isFailure) {
            return Result.fail(
                `memory.identifyModuleByPath(modulePath: '${modulePath}'): ${identifiedMemory.errorTitle}`,
                identifiedMemory.errorDescription!
            )
        }

        const glob = identifiedMemory.getValue().moduleMemory.glob
        // If the import is default import, then data is AraLink.
        if (identifiedNode.data instanceof AraLink) {
            identifiedNode.data = (glob as any).default;
            identifiedNode.importPath = undefined;
        } else {
            let data = (glob as any)[identifiedNode.identifier]
            identifiedNode.data = data;
            identifiedNode.importPath = undefined;
            identifiedNode.dataType = ((typeof data) as ValueTypeString);
            if (identifiedNode.dataType === ValueTypeString.number || 
                identifiedNode.dataType === ValueTypeString.boolean ||
                identifiedNode.dataType === ValueTypeString.string
            ) {
                identifiedNode.nodeType = AstNodeType.Literal;
            }
        }
        if (typeof identifiedNode.data === "function") {
            identifiedNode.nodeType = AstNodeType.Function;
        }
        
        return Result.ok(identifiedNode);
    }

    /**
     * Identify the value of the identifier. It's called when we don't know
     * what do we call, is it a variable declaration? A type declaration etc.
     * 
     * Currently supports Variable identification and enum identification.
     * @param {string} identifier identififer within the code
     */
    private identifyIdentifierRecursively = async <T extends ValueType, Y>(identifier: string, memory: ModuleMemory<Y>): Promise<Result<AstNode>> => {
        Debug.log(`Check identifier '${identifier}' value as variable first`)
        Debug.push(`identifyVariable()`, {identifier: identifier, update: 'false'})
        const res = await this.identifyVariable(identifier, memory, false);
        Debug.pop();
        Debug.log(`The '${identifier}' identified value '${JSON.stringify(res)}'`)
        if (res.isSuccess) {
            Debug.log(`The '${identifier}' is a variable successfully parsed, return '${JSON.stringify(res.getValue() as T)}' successfully`)
            const ok = Result.ok({nodeType: AstNodeType.Variable, data: res.getValue() as T})
            Debug.log(`The result to return back '${JSON.stringify(ok)}'`)
            return ok;
        }
        Debug.log(`Check is it an enum?`);

        const enumRes = await this.identifyEnum(identifier);
        if (enumRes.isSuccess) {
            return Result.ok({nodeType: AstNodeType.Enum, data: enumRes.getValue() as EnumMembers})
        }
        Debug.log(`The enum identified:`)
        Debug.log(enumRes)

        if (enumRes.isFailure) {
            Debug.log(`Identifier the data`)
            // If the variable wasn't defined within the script, then find it on
            // imports.
            const importPath = this.identifyImportPath(identifier);
            Debug.log(`The import path:`)
            Debug.log(importPath)
            if (importPath.isFailure) {
                return Result.fail(
                    `identifier not defined within this ast, this.identifyImportPath(identifier='${identifier}': ${importPath.errorTitle}`,
                    importPath.errorDescription!
                )
            }

            Debug.log(`identify content by module path`)
            Debug.push(`fileContentByModulePath()`, {modulePath: importPath.getValue()})
            const fileContentData = await fileContentByModulePath(importPath.getValue());
            Debug.pop();
            if (fileContentData.isFailure) {
                return Result.fail(
                    `identifier not defined within this ast, fileContentByModulePath(importPath='${importPath}'): ${fileContentData.errorTitle}`,
                    fileContentData.errorDescription!
                )
            }

            const sourceCode = fileContentData.getValue()?.fileContent.source;
            if (sourceCode !== undefined) {
                const subCode = new Code(fileContentData.getValue()!.fileContent.source!);
                const identified = await subCode.identifyIdentifierRecursively(identifier, memory)
                if (identified.isFailure) {
                    return Result.fail(
                        `identifier not defined within this ast, subCode.identifyValueByIdentifier(identifier='${identifier}'): ${identified.errorTitle}`,
                        identified.errorDescription!
                    )
                }

                return Result.ok(identified.getValue())
            } else {
                let data = await (fileContentData.getValue().fileContent.glob as any)[identifier]
                const identified: AstNode = {
                    nodeType: AstNodeType.Object,
                    data: data,
                    identifier: identifier,
                }
                return Result.ok(identified);
            }
        }

        return Result.fail(
            `Identifier is not identified`,
            `Its neither a variable nor enum which are supported for now`
        )
    }

    /**
     * Identify whether the given identifier is the enum, if so, return it's values
     * @param {string} identifier the enum name
     * @returns {error?: string, data? {[key: string]: string|number}} 
     */
    private identifyEnum = async(identifier: string): Promise<Result<EnumMembers>> => {
        let enumMembers: EnumMembers = {};
        const enumDeclaration = this.ast.getEnum(identifier);
        if (enumDeclaration === undefined) {
            return Result.fail(
                `this.ast.getEnum(identifier='${identifier}')`,
                `enum not found in AST`
            );
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
                                propertyValue = StringTraits.unquote(enumData.getText());
                            } else if (enumData instanceof NumericLiteral) {
                                propertyValue = JSON.parse(enumData.getText());
                            } else {
                                Debug.log(`enum (${identifier})'s enum member ${propertyIdentifier} is not a string literal, so we will use default numeration, catch it here in identifyEnum()`);
                                Debug.log(JSON.stringify(enumData))
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

        return Result.ok(enumMembers)
    }

    /**
     * ObjectLiteralExpression has three children:
     * @child {Node} '{'
     * @child {SyntaxList} anything
     * @child Node '}'
     * @param identifier 
     * @param data 
     * @param syntaxList 
     */
    private identifyObjectLiteral = async<T>(identifier: string|undefined, data: ValueType|undefined, dataType: ValueTypeString|any, syntaxList: SyntaxList, memory: ModuleMemory<T>): Promise<Result<ValueType>> => {
        const syntaxListElements = this.syntaxListElements(syntaxList);
        if (data === undefined) {
            data = this.exactValueByType(identifier!, dataType, data);
        }

        const dataElements: ValueType[] = [];
        const dataElementTypes: ValueTypeString|ValueType[] = [];
        const proeprtyIdentifiers: string[] = [];
        for (let i = 0; i < syntaxListElements.length; i++) {
            const element = syntaxListElements[i];
            
            Debug.push(`identifyValueType()`, {exp: element.getText()})
            const childValueType = this.identifyValueType(element);
            Debug.pop()
            if (childValueType.isFailure) {
                return Result.fail(
                    `syntaxList('${syntaxList.getText()}')/this.identifyValueType(child='${element.getText()}';i=${i}): ${childValueType.errorTitle}`,
                    childValueType.errorDescription!
                )
            }

            const exactIdentifier = this.exactIdentifier(element, identifier!);
            const exactExp = this.exactValueNode(element);
            if (childValueType.getValue() === ValueTypeString.property) {
                if (!(exactIdentifier in (data as any))) {
                    const err = Debug.error(
                        `The '${exactIdentifier}' property is not found in the object data`,
                        `Make sure that data and data type has the property from the element expression`,
                        {object: data, elementExpression: element.getText()},
                    )
                    return Result.fail(err)
                }
                const propertyValue = deepCopy((data as any)[exactIdentifier])
                const propertyValueType = this.identifyDataValueType(propertyValue)
                if (propertyValueType.isFailure) {
                    const err = Debug.error(
                        `this.identifyDataValueType(): ${propertyValueType.errorTitle}`,
                        propertyValueType.errorDescription!,
                        {
                            data,
                            propertyIdentifier: exactIdentifier,
                            propertyValue: propertyValue,
                            propertyType: typeof ((data as any)[exactIdentifier])
                        }
                    )
                    return Result.fail(err);
                }
                dataElements.push(propertyValue)
                dataElementTypes.push(propertyValueType.getValue())
                proeprtyIdentifiers.push(exactIdentifier)
                syntaxListElements[i] = exactExp;
                Debug.log(`The '${exactIdentifier}' property's value is ${(data as any)[exactIdentifier]}: type = '${typeof ((data as any)[exactIdentifier])}' type`)
                continue;
            } else if (childValueType.getValue() !== ValueTypeString.object) {
                const err = Debug.error(
                    `The element in object literal is neither property assignment nor object spread`,
                    `update identifyObjectLiteral() to support it`,
                    {object: data, element: element.getText(), elementExpress: element},
                )

                return Result.fail(err)
            }
            dataElements.push({})
            dataElementTypes.push(dataType)
            proeprtyIdentifiers.push('')
            syntaxListElements[i] = exactExp;
        }

        Debug.log(`Idenfied object list`);
        Debug.log(dataElements)
        Debug.log(dataElementTypes)
        Debug.log(proeprtyIdentifiers)

        Debug.push(`this.identifySyntaxList()`, {syntaxListElements: `${syntaxListElements.length} elements`})
        const identified = await this.identifySyntaxList(syntaxListElements, dataElements, dataElementTypes, memory);
        Debug.pop();
        
        if (identified.isFailure) {
            const err = Debug.error(
                `this.identifySyntaxList(): ${identified.errorTitle}`,
                identified.errorDescription!,
                {
                    syntaxListElements, dataElements, dataElementTypes
                }
            )
            return Result.fail(err)
        }

        for (let i = 0; i < identified.getValue().length; i++) {
            const child = identified.getValue()[i];
            if (proeprtyIdentifiers[i].length > 0) {
                (data as any)[proeprtyIdentifiers[i]] = child;
            } else {
                (data as any) = {...deepCopy(data as object), ...deepCopy(child as any)}
            }
        }

        Debug.log(`Identified object literal:`)
        Debug.log(data)

        return Result.ok(data)
    }

    /**
     * If the DataType is 
     * @param dataType 
     * @param data 
     * @param memory 
     * @returns 
     */
    private identifyDataType = <T>(dataType: IdentifiedNodeDataType, data: ValueType, memory: ModuleMemory<T>): Result<ValueTypeString|any> => {
        if (Object.values(ValueTypeString).includes(dataType as ValueTypeString)) {
            return Result.ok(dataType)
        }
        if (!(dataType instanceof AraLink)) {
            return Result.fail(
                `Data Type is not an AraLink`,
                `Update identifyDataType() to support the '${dataType.toString()}' data type`
            )
        }

        const dataTypeLink = dataType as AraLink<string>;

        if (!ReflectAraLink.isIdentifierLink(dataTypeLink)) {
            return Result.fail(
                `Data Type must be only a link to the identifier`,
                `Update identifyDataType() to support the '${dataTypeLink.toString()}' types of ara links`
            )
        }

        const typeNode = memory.identifierByType(dataTypeLink.resource as string, AstNodeType.Type);
        if (typeNode === undefined) {
            return Result.fail(
                `memory.identifierByType(identifier: '${dataTypeLink.resource as string}', astNode: '${AstNodeType.Type}')`,
                `Memory doesn't have the node by it's identifier`
            )
        }
        Debug.log(`The identified type node is`)
        Debug.log(typeNode)

        Debug.log(`Identifying the '${data.toString()}' data's actual data by '${dataType.toString()}' unsupported`)
        Debug.log(dataType);
        Debug.log(`The typeof typeNode`);
        if ((dataTypeLink.properties as any)["type"] !== undefined) {
            Debug.log(`The typedef is an array`);
            const dataTypeProperty = (dataTypeLink.properties as any)["type"] as string;
            if (dataTypeProperty) {
                const dataType = [typeNode.data!] as Array<typeof typeNode.data>;
                Debug.log(`The data type:`)
                Debug.log(dataType);
                return Result.ok(dataType)
            }
        }
        return Result.ok(typeNode.data! as typeof typeNode.data)
    }

    private identifyDataValueType = (data: ValueType): Result<ValueTypeString> => {
        if (typeof data === "boolean") {
            return Result.ok(ValueTypeString.boolean)
        } else if (typeof data === "number") {
            return Result.ok(ValueTypeString.number);
        } else if (typeof data === "object") {
            return Result.ok(ValueTypeString.object);
        } else if (typeof data === "string") {
            return Result.ok(ValueTypeString.string);
        }

        return Result.fail(
            `The unsupported data type '${typeof data}}`,
            `Ara Web doesn't '${JSON.stringify(data)}' data's type. Update the identifyDataValueType`
        )
    }

    private identifyValueType = (exp: Node): Result<ValueTypeString> => {
        if (exp === undefined) {
            return Result.fail(
                `Can not detect the expression's value type`,
                `The 'undefined' is not supported by Ara Web`
            )
        }
        if (exp instanceof ObjectLiteralExpression) {
            return Result.ok(ValueTypeString.object)
        } else if (exp instanceof SpreadAssignment) {
            return Result.ok(ValueTypeString.object);
        } else if (exp instanceof PropertyAssignment) { // {obj.property: val}
            return Result.ok(ValueTypeString.property)
        } else if (exp instanceof Identifier) {
            return Result.ok(ValueTypeString.default);
        } else if (exp instanceof ArrayLiteralExpression) {
            return Result.ok(ValueTypeString.array)
        } else if (exp instanceof PropertyAccessExpression) {
            return Result.ok(ValueTypeString.property)
        } else if (exp instanceof CallExpression) {
            return Result.ok(ValueTypeString.default);
        } else if (exp instanceof StringLiteral) {
            return Result.ok(ValueTypeString.string)
        } else if (exp instanceof ShorthandPropertyAssignment) {
            return Result.ok(ValueTypeString.property)
        } else if (exp instanceof ConditionalExpression) {
            return Result.ok(ValueTypeString.default);
            Debug.log(`Conditional expression '${exp.getText()}' has '${exp.getChildCount()}' children:`);
            const condition = exp.getChildAtIndex(0);
            const trueExpression = exp.getChildAtIndex(2);
            const falseExpression = exp.getChildAtIndex(4);
            Debug.log(`Todo: check '${condition.getText()}' is true (binary expression)`);
            Debug.log(`Todo check '${trueExpression.getText()}' binary expression value`);
            Debug.log(`Todo check '${falseExpression.getText()}' string literal value`);
        } else if (exp instanceof BinaryExpression) {
        }

        Debug.log(`Identifying the value of '${exp.getText()}' not yet supported. Fill data of exp:`)
        Debug.log(exp);

        return Result.fail(
            `Can not detect the expression's value type`,
            `The '${exp.getText()}' is not supported by Ara Web`
        )
    }

    private identifyConditionValue = (leftSide: any, condition: string, rightSide: any): boolean => {
        if (condition.indexOf("!") > -1) {
            return leftSide != rightSide;
        } else if (condition.indexOf(">=") > -1) {
            return leftSide >= rightSide;
        } else if (condition.indexOf("<=") > -1) {
            return leftSide <= rightSide;
        } else if (condition.indexOf(">") > -1) {
            return leftSide > rightSide;
        } else if (condition.indexOf("<") > -1) {
            return leftSide < rightSide;
        } else {
            return leftSide == rightSide;
        }
    }

    private identifyArithmeticValue = (leftSide: any, condition: string, rightSide: any): string|number => {
        if (condition.indexOf("+") > -1) {
            return leftSide + rightSide;
        } else if (condition.indexOf("-") > -1) {
            return leftSide - rightSide;
        } else if (condition.indexOf("/") > -1) {
            return leftSide / rightSide;
        } else if (condition.indexOf("*") > -1) {
            return leftSide * rightSide;
        } else {
            // Modulo
            return leftSide % rightSide;
        }
    }

    private isBooleanNode = (op: string): boolean => {
        if (op.indexOf("!=") > -1 || 
            op.indexOf(">=") > -1 ||
            op.indexOf("<=") > -1 ||
            op === "==" || 
            op === "==="
        ) {
            return true;
        }
        return false;
    }

    private isArithmeticNode = (op: string): boolean => {
        if (op.indexOf("+") > -1 ||
        op.indexOf("-") > -1 ||
        op.indexOf("/") > -1 ||
        op.indexOf("*") > -1 ||
        op.indexOf("%")) {
            return true;
        }

        return false;
    }

    private syntaxListElements = (syntaxList: SyntaxList): Node[] => {
        const nodes: Node[] = [];
        if (syntaxList === undefined) {
            return nodes;
        }

        for (let i = 0; i < syntaxList.getChildCount(); i++) {
            const child = syntaxList.getChildAtIndex(i);
            // Delimeter is skipped
            if (TsNode.isKeyword(new TsNode(child), ",")) {
                continue;
            } else if (TsNode.isNonImportant(new TsNode(child))) {
                continue;
            }
            nodes.push(child)
        }
        return nodes;
    }

    private identifySyntaxList = async <T>(nodes: Node[], dataElements: (ValueType)[], dataElementTypes: (ValueTypeString|any)[], memory: ModuleMemory<T>): Promise<Result<(ValueType)[]>> => {        
        Debug.log(`Identify Syntax List ${nodes.length} nodes, with `)
        Debug.log(dataElements)
        Debug.log(dataElementTypes)
        for (let i = 0; i < nodes.length; i++) {
            const child = nodes[i];

            const indexKey = `__array_${i.toString()}`;
            const nodeKey = `${i}/${nodes.length - 1}`
            Debug.log(`${i}/${nodes.length - 1}) child expression '${child.getText()}' to identify`)
            Debug.log(dataElements)
            Debug.log(dataElementTypes)
            Debug.push(`this.identifyValue`, {identifier: indexKey, data: JSON.stringify(dataElements[i]), dataType: JSON.stringify(dataElementTypes[i]), exp: child.getText()})
            let identified = await this.identifyValue(indexKey, dataElements[i], dataElementTypes[i], child, memory);
            Debug.pop();

            if (identified.isFailure) {
                const err = Debug.error(
                    `${i}/${nodes.length-1}) child: ${identified.errorTitle}`,
                    identified.errorDescription!,
                    {
                        nodes: nodes, 
                        // dataElements: dataElements,
                        // dataElementTypes: dataElementTypes,
                    }
                )
                return Result.fail(err)
            } else {
                Debug.log(`${nodeKey}) child identified:`)
                Debug.log(`${nodeKey} The elements`)
                Debug.log(dataElements)
                Debug.log(`${nodeKey} Types:`);
                Debug.log(dataElementTypes)
                Debug.log(`${nodeKey} The data element is identified? DO not update yet`)
            
                dataElements[i] = identified.getValue()!
                Debug.log(dataElements)
            }
        }

        return Result.ok(dataElements);
    }

    private identifyArrayExpression = async <T>(syntaxList: SyntaxList, data: ValueType|undefined, dataType: ValueTypeString|undefined|any, memory: ModuleMemory<T>): Promise<Result<ValueType[]>> => {
        if (!Array.isArray(data)) {
            const err = Debug.error(
                `Data is not an array when expression is array literal`,
                `Pass to identifyArrayExpression() the array`,
                data,
            )
            return Result.fail(err)
        }
            
        if (dataType === undefined) {
            const err = Debug.error(
                `Data Type is missing, failed to identify the array type`,
                `What kind of array it is not clear`,
                dataType,
            )
            return Result.fail(err)
        } 

        const dataElementType = (dataType as Array<any>)[0];
        const dataElement = this.exactValueByType(`__array_first_element`, dataElementType, data);
        if (dataElement.isFailure) {
            const err = Debug.error(
                `this.exactValueByType(): ${dataElement.errorTitle}`,
                dataElement.errorDescription!,
                {
                    identifier: `$__array_first_element`,
                    dataType: dataType
                }
            )
            return Result.fail(err)
        }
        Debug.log(`The data element that each array element should match`)
        Debug.log(dataElement)
        Debug.log(dataType)

        const syntaxListElements = this.syntaxListElements(syntaxList);
        if (syntaxListElements.length === 0) {
            return Result.ok(data);
        }

        const dataElements: ValueType[] = [];
        const dataElementTypes: ValueTypeString|ValueType[] = [];
        for (let i = 0; i < syntaxListElements.length; i++) {
            dataElements.push(this.exactValueByType(`_array_element_${i}`, dataElementType, data).getValue()!);
            dataElementTypes.push(JSON.parse(JSON.stringify(dataElementType)) as typeof dataElementType);
        }

        Debug.log(`Pass the ${syntaxListElements.length} elements with element data and types:`)
        Debug.log(dataElements)
        Debug.log(dataElementTypes)
        Debug.log(`The Element types are updated? And are they refer to the same data?`)
        for (let i = 0; i< syntaxListElements.length; i++) {
            Debug.log(`Is ${i} index data element matches first? ${dataElements[i]}? '${dataElements[0] === dataElements[i]}'`)
            Debug.log(`Is ${i} index data element type matches first? ${dataElementTypes[i]}? '${dataElementTypes[0] === dataElementTypes[i]}'`)
        }

        Debug.push(`this.identifySyntaxList()`, {syntaxListElements: `${syntaxListElements.length} elements`})
        const identified = await this.identifySyntaxList(syntaxListElements, dataElements, dataElementTypes, memory);
        Debug.pop();
        if (identified.isFailure) {
            const err = Debug.error(
                `this.identifySyntaxList(): ${identified.errorTitle}`,
                identified.errorDescription!,
                {
                    syntaxListElements, dataElements, dataElementTypes
                }
            )
            return Result.fail(err)
        }

        for (let i = 0; i < identified.getValue().length; i++) {
            const child = identified.getValue()[i];
            if (i < data.length) {
                data[i] = child;
            } else {
                data.push(child);
            }
        }

        return Result.ok(data);
    }

    private dataTypeToLinkProperties = (dataType: ValueTypeString|ValueType): EnumMembers|undefined => {
        if (ValueTypeString.array === dataType || Array.isArray(dataType)) {
            return {"type": "array"}
        }
        return undefined;
    }

    /**
     * Identify the expression, possible the expression is the value of 'identifier'.
     * @param {string|undefined} identifier that holds the expression
     * @param {ValueType|undefined} data default value that it must override
     * @param {Node} exp node
     * @param {ProjectMemory} memory with the defined identifiers
     * @param {ValueTypeString|any|undefined} dataType Data Type or a sample data
     * @returns 
     */
    private identifyValue = async <T>(identifier: string|undefined, data: ValueType|undefined, dataType: ValueTypeString|undefined|any, exp: Node, memory: ModuleMemory<T>): Promise<Result<ValueType>> => {
        Debug.log(`Identify the value of '${exp.getText()}' expression, optionally it's the value of '${identifier}', wich has '${JSON.stringify(data)}'`);
        if (exp instanceof ObjectLiteralExpression) {
            const syntaxList = exp.getChildSyntaxList()!;
            Debug.log(`'${identifier}' identifier is the object literal with syntax list(child_length=${syntaxList.getChildCount()}) = [${syntaxList.getText()}]`)

            Debug.push(`identifyObjectLiteral()`, {'identifier': identifier!, data: JSON.stringify(data), 'syntaxList': `[${syntaxList.getText()}]`})
            const identified = await this.identifyObjectLiteral(identifier, data, dataType, syntaxList, memory);
            Debug.pop()
            Debug.log(`identifyObjectLiteral identification result for '${identifier}' identifier = '${JSON.stringify(identified)}'`)
            if (identified.isFailure) {
                Debug.log(`The object literal identification error: ${JSON.stringify(identified.errorTitle)}, description = ${identified.errorDescription}`);
                return Result.fail(
                    `this.identifyObjectLiteral<T>(identifier='${identifier}', data='${JSON.stringify(data)}', syntaxList='${syntaxList.getText()}'): ${identified.errorTitle}`,
                    identified.errorDescription!
                )
            } else {
                return Result.ok(deepCopy(identified.getValue() as object))
            }
        } else if (exp instanceof SpreadAssignment) {
            const spreadSource = exp.getChildAtIndex(1);
            Debug.push(`exp as SpreadAssignment(spreadSource='${spreadSource.getText()}')`)
            const identified = await this.identifyValue(identifier, data, dataType, spreadSource, memory);
            Debug.pop();
            if (identified.isFailure) {
                return Result.fail(
                    `spreadAssignment('${exp.getText()}')/spreadSource('${spreadSource.getText()}')/this.identifyValue(identifier='${identifier}', data='${JSON.stringify(data)}', spreadSource='${spreadSource.getText()}'): ${identified.errorTitle}`,
                    identified.errorDescription!
                )
            } else {
                return Result.ok(identified.getValue())    
            }
        } else if (exp instanceof PropertyAssignment) { // {obj.property: val}
            Debug.log(`Property assignment '${exp.getText()}' of ${identifier} identifier`);
            const property = exp.getChildAtIndex(0);
            const value = exp.getChildAtIndex(2);
            Debug.push(`exp as PropertyAssignment()`, {exp: exp.getText()})
            const propertyValue = ((data as Object)[property.getText()]);
            
            const propertyIdentifier = `${identifier}.${property.getText()}`

            // Assigned value to the (data: T).object's property
            Debug.push(`identifyValue<${typeof propertyValue}>()`, {identifier: propertyIdentifier, data: JSON.stringify(propertyValue), exp: value.getText()})
            const res = await this.identifyValue(propertyIdentifier, propertyValue, dataType, value, memory);
            Debug.pop();
            Debug.pop();
            if (res.isFailure) {
                return Result.fail(
                    `propertyAssignment('${exp.getText()}')/this.identifyValue(property='${property.getText()}', data='${JSON.stringify(propertyValue)}', value='${value.getText()}'): ${res.errorTitle}`,
                    res.errorDescription!
                )
            }
            (data as any)[property.getText()] = res.getValue();
            return Result.ok(data);
        } else if (exp instanceof Identifier) {
            Debug.push(`exp as Identifier`)
            if (exp.getText() === "undefined") {
                const emptyValue = this.emptyValueByType(identifier!, dataType);
                Debug.pop();
                return Result.ok(emptyValue);
            } else if (exp.getText() === identifier) {
                Debug.log(`The '${identifier}' value is itself, so return it.`)
                Debug.pop();
                return Result.ok(data);
            } else {
                Debug.pop();
                return Result.ok(ReflectAraLink.linkToIdentifier(exp.getText(), this.dataTypeToLinkProperties(dataType)))
                // const identified = await this.identifyVariable<T>(exp.getText(), memory)
                // Debug.pop();

                // Debug.pop();
                // if (identified.isFailure) {
                //     return Result.fail(
                //         `identifier('${exp.getText()}')/this.identifyVariable(exp='${exp.getText()}': ${identified.errorTitle}`,
                //         identified.errorDescription!
                //     );
                // }
                // return Result.ok(identified.getValue())
            }
        } else if (exp instanceof ArrayLiteralExpression) {
            const syntaxList = exp.getChildAtIndex(1) as SyntaxList;
            Debug.push(`exp as ArrayLiteral()`, {syntaxList: syntaxList.getText()})
            const identified = await this.identifyArrayExpression(syntaxList, data, dataType, memory)
            Debug.pop();

            if (identified.isFailure) {
                const err = Debug.error(
                    `this.identifyArrayExpression: ${identified.isFailure}`,
                    identified.errorDescription!,
                    {
                        syntaxList, data, dataType
                    }
                )

                return Result.fail(err)
            }

            return Result.ok(data);
        } else if (exp instanceof PropertyAccessExpression) {
            const varIdentifier = exp.getChildAtIndex(0);
            const propertyIdentifier = exp.getChildAtIndex(2);
            Debug.push(`exp as PropertyAccess()`, {var: varIdentifier.getText(), property: propertyIdentifier.getText()})
            Debug.push(`this.identifyIdentifierRecursively()`, {identifier: varIdentifier.getText()})
            // Attempt to find the variable's value within this script            
            const identified = await this.identifyIdentifierRecursively(varIdentifier.getText(), memory);
            Debug.pop();
            if (identified.isFailure) {
                Debug.pop();
                return Result.fail(
                    `propertyAccessExpression('${exp.getText()}')/this.identifyIdentifierRecursively(varIdentifier='${varIdentifier.getText()}'): ${identified.errorTitle}`,
                    identified.errorDescription!
                )
            }
           
            if (identified.getValue().nodeType === AstNodeType.Enum) {
                let identifiedData = identified.getValue().data as EnumMembers;
                Debug.pop();
                if (propertyIdentifier.getText() in identifiedData) {
                    return Result.ok(identifiedData[propertyIdentifier.getText()] as ValueType)
                } else {
                    return Result.fail(
                        `Invalid enum`,
                        `The '${identifier}' is identified as property access to the Enum ${varIdentifier}. But this enum doesn't have '${propertyIdentifier.getText()}' member`
                    )
                }
            } else if (identified.getValue().nodeType === AstNodeType.Object) {
                let identifiedData = identified.getValue().data as Object;
                Debug.pop();
                if (propertyIdentifier.getText() in identifiedData) {
                    return Result.ok(identifiedData[propertyIdentifier.getText()] as ValueType)
                } else {
                    return Result.fail(
                        `Invalid enum`,
                        `The '${identifier}' is identified as property access to the Enum ${varIdentifier}. But this enum doesn't have '${propertyIdentifier.getText()}' member`
                    )
                }
            } else {
                Debug.log(`The identified data is not an enum nor a variable with object, then how to use it:`);
                Debug.log(identified)
                Debug.pop();
            }
        } else if (exp instanceof CallExpression) {
            Debug.push(`exp as Function Call`)
            Debug.push(`this.identifyFunctionCall()`, {'exp': exp.getText()})
            const exprResult = await this.identifyFunctionCall(exp as CallExpression, memory);
            Debug.pop();
            Debug.pop();
            if (exprResult.isFailure) {
                return Result.fail(
                    `this.identifyFunctionCall(exp: '${exp.getText()}'): ${exprResult.errorTitle}`,
                    exprResult.errorDescription!,
                )
            }
            return exprResult;
        } else if (exp instanceof StringLiteral) {
            return Result.ok(
                StringTraits.unquote(exp.getText()) as string,
            )
        } else if (exp instanceof ShorthandPropertyAssignment) {
            const propertyIdentifier = exp.getChildAtIndex(0);
            Debug.push(`exp as ShortHandPropertyAssignment`)
            // Attempt to find the variable's value within this script            
            const propertyValue = (data as Object)[propertyIdentifier.getText()]
            Debug.log(`The '${propertyIdentifier.getText()}' is the property name of ${identifier} identifier, whose value = '${JSON.stringify(data)}', and a variable in the script`)
            Debug.push(`this.identifyIdentifierRecursively<typeof ${typeof propertyValue}>(propertyIdentifier='${propertyIdentifier.getText()}')`)
            const identified = await this.identifyIdentifierRecursively<typeof propertyValue, T>(propertyIdentifier.getText(), memory);
            Debug.pop();
            Debug.log(`Property that was identified: '${propertyIdentifier.getText()}', identified result = ${JSON.stringify(identified.getValue())}, current property value = ${JSON.stringify(propertyValue)}`)
            Debug.log(`Property that was identified: '${propertyIdentifier.getText()}', data = ${JSON.stringify(data)}`)
            if (identified.isFailure) {
                Debug.pop();
                return Result.fail(
                    `shorthandPropertyAssignment('${exp.getText()}')/this.identifyIdentifierRecursively(propertyIdentifier='${propertyIdentifier.getText()}'): ${identified.errorTitle}`,
                    identified.errorDescription!
                )
            }

            (data as Object)[propertyIdentifier.getText()] = identified.getValue().data!
            Debug.log(`The updated object:`)
            Debug.log(JSON.stringify(data))
            Debug.pop();

            return Result.ok(data);
        } else if (exp instanceof ParenthesizedExpression) {
            const childAmount = exp.getChildCount();
            if (childAmount !== 3) {
                return Result.fail(
                    `ParenthesizedExpression('${exp.getText()}')`,
                    `Parenthesized expression must have 3 children, with '${childAmount}' children Ara Web is not supporting, contact to change identifyValue()`,
                )    
            }

            const result = await this.identifyValue(identifier, data, dataType, exp.getChildAtIndex(1), memory);
            if (result.isFailure) {
                return Result.fail(
                    `ParenthesizedExpression('${exp.getText()}'): this.identifyValue(identifier='${identifier}', data='${JSON.stringify(data)}', secondChild='${exp.getChildAtIndex(1).getText()}'): ${result.errorTitle}`,
                    result.errorDescription!
                )
            }
            return Result.ok(result.getValue());
        } else if (exp instanceof ConditionalExpression) {
            const condition = exp.getChildAtIndex(0);
            const trueExpression = exp.getChildAtIndex(2);
            const falseExpression = exp.getChildAtIndex(4);
            Debug.push(`this.identifyValue<boolean>(identifier='${identifier}_condition', data=false, exp='${condition.getText()}')`)
            const conditionResult = await this.identifyValue(`${identifier}_condition`, false, ValueTypeString.boolean, condition, memory);
            Debug.pop();
            if (conditionResult.isFailure) {
                return Result.fail(
                    `this.identifyValue<boolean>('${identifier}_condition', data=false, condition='${condition.getText()}'): ${conditionResult.errorTitle}`,
                    conditionResult.errorDescription!
                )
            }
            let res: Result<ValueType>;
            let errTitle: string;
            const conditionValue = conditionResult.getValue() as boolean;
            if (conditionValue) {
                res = await this.identifyValue(`${identifier}_left_side`, {}, ValueTypeString.object, trueExpression, memory);
                if (res.isFailure) {
                    errTitle = `this.identifyValue<ValueType>('${identifier}_left_side', data={}, exp='${trueExpression.getText()}'): ${res.errorTitle}`
                }
            } else {
                res = await this.identifyValue(`${identifier}_right_side`, {}, ValueTypeString.object, falseExpression, memory);
                if (res.isFailure) {
                    errTitle = `this.identifyValue<ValueType>('${identifier}_right_side', data={}, exp='${falseExpression.getText()}'): ${res.errorTitle}`
                }
            }
            if (res.isFailure) {
                return Result.fail(
                    errTitle!,
                    res.errorDescription!
                )
            }
            return Result.ok(res.getValue());
        } else if (exp instanceof BinaryExpression) {
            const op = exp.getChildAtIndex(1).getText();
            if (typeof data === "boolean" || this.isBooleanNode(op)) {
                const left = exp.getChildAtIndex(0);
                const right = exp.getChildAtIndex(2);
                const leftValue = await this.identifyValue('left_side', {}, ValueTypeString.object, left, memory);
                if (leftValue.isFailure) {
                    return Result.fail(
                        `this.identifyValue<object>('left_side', data={}, left='${left.getText()}'): ${leftValue.errorTitle}`,
                        leftValue.errorDescription!
                    )
                }

                const rightValue = await this.identifyValue('right_side', {}, ValueTypeString.object, right, memory);
                if (rightValue.isFailure) {
                    return Result.fail(
                        `this.identifyValue<object>('right_side', data={}, right='${left.getText()}'): ${rightValue.errorTitle}`,
                        rightValue.errorDescription!
                    )
                }

                const conditionValue = this.identifyConditionValue(leftValue.getValue(), op, rightValue);
                return Result.ok(conditionValue);
            } else if (this.isArithmeticNode(op)) {
                const left = exp.getChildAtIndex(0);
                const right = exp.getChildAtIndex(2);
                const leftValue = await this.identifyValue('left_side', {}, ValueTypeString.object, left, memory);
                if (leftValue.isFailure) {
                    return Result.fail(
                        `this.identifyValue<object>('left_side', data={}, left='${left.getText()}'): ${leftValue.errorTitle}`,
                        leftValue.errorDescription!
                    )
                }

                const rightValue = await this.identifyValue('right_side', {}, ValueTypeString.object, right, memory);
                if (rightValue.isFailure) {
                    return Result.fail(
                        `this.identifyValue<object>('right_side', data={}, right='${right.getText()}'): ${rightValue.errorTitle}`,
                        rightValue.errorDescription!
                    )
                }

                const arithResult = this.identifyArithmeticValue(leftValue.getValue(), op, rightValue.getValue());
                return Result.ok(arithResult);
            } else {
                Debug.log(`The unsupported boolean expression, its neither boolean nor arithmetic: '${exp.getChildAtIndex(1).getText()}'`)
                Debug.log(exp.getChildAtIndex(1))
                return Result.fail(
                    `Unsupported binary expression`,
                    `Only boolean binary expressions supported, given '${exp.getText()}' is not yet supported, update identifyValue()`
                )
            }
        } else if (exp instanceof PrefixUnaryExpression) {
            Debug.push(`exp as PrefixUnaryExpression`);
            const prefix = exp.getFirstChild();
            if (prefix?.getText() !== "!") {
                Debug.pop();
                return Result.fail(
                    `exp as PrefixUnaryExpression: only '!' prefix is supported`,
                    `The '${prefix?.getText()}' is not supported by Ara Web. Update the identifyValue() method in codeLevel`
                )
            }
            const trueExp = exp.getLastChild();
            const expIdentifier = `prefix_unary_${trueExp?.getText()}`;
            Debug.push(`this.identifyValue<T>(identifier: '${expIdentifier}', data: '${JSON.stringify(data)}', exp: ${trueExp?.getText()})`)
            const trueValueResult = await this.identifyValue(expIdentifier, data, dataType, trueExp!, memory);
            Debug.pop();
            Debug.pop();
            if (trueValueResult.isFailure) {
                return Result.fail(
                    `exp as PrefixUnaryExpression: this.identifyValue<T>(identifier: '${trueExp?.getText()}', data: '${JSON.stringify(data)}', exp: ${trueExp?.getText()}): ${trueValueResult.errorTitle}`,
                    trueValueResult.errorDescription!
                )
            }
            // TODO #1
            // cancelSlug when identifying !cancelSlug is not working.
            // As its the infinite recursive loop (!cancelSlug -> cancelSlug -> !canSlug by updateFunction)
            // Therefore, identify the variables in the module.
            // identify their assignment.

            // First identify the variables then update the variables by the given identifier.
            // And the update variable is accesses the memory.

            // TODO #2
            // Identify the imports in the memory.
            // Identify the imports as newName,
            // identify the type imports,
            // identify the type { name, name },
            // identify the default, and in the skobes,
            // Then, change recursiveValue by the value.
            return Result.ok(!trueValueResult.getValue())
        } else {
            Debug.log(`The '${exp.getText()}' expression is not supported by identifyValue yet:`);
            Debug.log(exp);
            return Result.fail(
                `Failed variable's node: '${exp.getText()}'`,
                `The '${exp.getText}' variable value's node is not handled by Ara Web yet. Change identifyValue() to fix it`
            )
        }

        Debug.log(`The '${exp.getText()}' not yet supported by Ara Web`)
        Debug.log(exp);
        Debug.log(`\n\n`)
        return Result.fail(`Unsupported expression`, `The '${exp.getText()}' not yet supported by Ara Web`)
    } 

    /**
     * If the variable is updated by a function, then those functions are called by this method.
     * Returns TRUE, if no functions update the variable
     * @param data
     * @returns {error?: string, succeed: boolean}
     * @todo NOT IMPLMENETED
     */
    private identifyVariableUpdateInFunction = (identifier: string, data: ValueType|undefined, dataType: ValueTypeString|ValueType): Result<any> => {
        return Result.ok(data);
    }


    /**
     * Call the function and return it's result
     * @param {string} funcName function literal
     * @param {any[]} funcArgs function argument
     * @returns {error?: string, data?: T}
     */
    private callFunc = async (funcName: string, funcArgs: any[]): Promise<Result<ValueType>> => {
        // Find the function
        const res = this.identifyImportPath(funcName);
        if (res.isFailure) {
            return Result.fail(
                `this.identifyImportPath(funcName='${funcName}'): ${res.errorTitle}`,
                res.errorDescription!
            )
        }

        const moduleRes = await callFuncInModule(res.getValue(), funcName, funcArgs);
        if (moduleRes.isFailure) {
            return Result.fail(
                `callFuncInModule(modulePath='${res.getValue()}', funcName='${funcName}', funcArgs='${JSON.stringify(funcArgs)}')`,
                moduleRes.errorDescription!
            )
        }

        return Result.ok(moduleRes.getValue());
    }

    /**
     * Does the given ImportDeclaration holds the definition of the literal?
     * @param {string} literal a variable, constant, function to look for 
     * @param astImport the import module declaration
     * @returns {boolean}
     */
    private identifyImportDeclaration = (literal: string): TsImportDeclaration|undefined => {
        const astImports = this._ast.getImportDeclarations();

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
                Debug.log(`TODODODODODODO Namespace imports:`)
                Debug.log(JSON.stringify(namespaceImport))
            }

            const astAttr = astImport.getAttributes()
            if (astAttr !== undefined) {
                Debug.log(`TODODODODODODO Import attributes:`)
                Debug.log(JSON.stringify(astAttr))
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
     * Identify the Import Path of the given identifier
     * @param {string} identifier
     * @param {ImportDeclaration} astImport 
     * @returns {string} the module path
     */
    public identifyImportPath = (identifier: string, astImport?: TsImportDeclaration): Result<string> => {
        Debug.log(`identifyImportPath todo: Identify import path must get the data from the Memory`);
        if (astImport === undefined) {
            astImport = this.identifyImportDeclaration(identifier)
            if (astImport === undefined) {
                return Result.fail(
                    `this.identifyImportDeclaration(identifier='${identifier}')`,
                    `The given identifier not found in the import declaration`
                )
            }
        }

        // Since identify import declaration was correct for sure it will occur
        let result: Result<string> = Result.ok("");

        for (let child of astImport.getChildren()) {
            if (child instanceof StringLiteral) {
                result = Result.ok(StringTraits.unquote(child.getText()))
            }
        }

        return result;
    }

    private identifyMethodCall = async<T>(method: PropertyAccessExpression, methodArgs: SyntaxList, memory: ModuleMemory<T>): Promise<Result<ValueType>> => {
        const methodOwner = method.getFirstChild();
        const funcName = method.getLastChild();
        Debug.log(`identifyMethod Call the object = '${methodOwner?.getText()}', method = '${funcName?.getText()}'`);
        Debug.push(`this.identifyValue(identifier='${methodOwner?.getText()}',data={}, exp='${methodOwner?.getText()}')`)
        const methodObj = await this.identifyValue(methodOwner?.getText(), {}, {}, methodOwner!, memory);
        Debug.pop();
        Debug.log(`The object value:`)
        Debug.log(methodObj)

        // const propertyValue = (data as any)[funcName.getText()]

        return Result.fail(`undefined`, 'method not supported')
    }

    /**
     * Calls the function and returns its result
     * The value clause is the function call? `foo()` will be turned into four nodes:
     *  1: Identifier(foo), 
     *  2: Node(\(), 
     *  3: SyntaxList(""), 
     *  4: Node(\))
     * @param {CallExpression} exp the node with the function call
     * @returns {error?: string, data?: T}
     */
    private identifyFunctionCall = async<T>(exp: CallExpression, memory: ModuleMemory<T>): Promise<Result<ValueType>> => {
        const firstChild = exp.getChildAtIndex(0) as PropertyAccessExpression;
        const syntaxList = exp.getChildAtIndex(2) as SyntaxList;
        if (firstChild instanceof PropertyAccessExpression) {
            Debug.push(`this.identifyMethodCall<T>()`, {'method': firstChild.getText(), 'methodArgs': syntaxList.getText()})
            const res = await this.identifyMethodCall(firstChild, syntaxList, memory)
            Debug.pop();
            if (res.isFailure) {
                return Result.fail(
                    `this.identifyMethodCall<T>(firstChild='${firstChild.getText()}', syntaxList='[${syntaxList.getText()}]'): ${res.errorTitle}`,
                    res.errorDescription!
                )
            }
            return Result.ok(res.getValue())
        } else {
            Debug.log(`The function call is not a method call, so continue.`)
        }

        const identifier = exp.getChildAtIndex(0) as Identifier;
        const funcName = identifier.getText();
        const funcArgs: any[] = [];
        let openParenthesis: boolean = false;
        for (let i = 1; i < exp.getChildCount(); i++) {
            const subChild = exp.getChildAtIndex(i);
            if (subChild.getText() === "(") {
                openParenthesis = true;
            } else if (subChild.getText() === ")") {
                continue;
            } else if (!(subChild instanceof SyntaxList) || subChild.getText() !== "" ) {
                if (openParenthesis === false) {
                    continue;
                }
                if (subChild instanceof SyntaxList) {
                    for (let funcArg of subChild.getChildren()) {
                        if (funcArg.getText() === ",") {
                            continue;
                        }
                        let result = await this.identifyValue(`${funcName}_call_by_${identifier.getText()}`, {}, {}, funcArg, memory);
                        if (result.isFailure) {
                            return Result.fail(
                                `func arg is multiple arguments, SyntaxList('${subChild.getText()}'): this.identifyValue(funcArg='${funcArg.getText()}', {}, funcArg='${funcArg.getText()}'): ${result.errorTitle}`,
                                result.errorDescription!
                            )
                        } else {
                            funcArgs.push(result.getValue())
                        }
                    }
                } else {
                    let result = await this.identifyValue(subChild.getText(), {}, {}, subChild, memory);
                    if (result.isFailure) {
                        return Result.fail(
                            `func arg is a single argument: this.identifyValue(subChild='${subChild.getText()}', {}, subChild='${subChild.getText()}'): ${result.errorTitle}`,
                            result.errorDescription!
                        )
                    } else {
                        funcArgs.push(result.getValue())
                    }
                }
            }
        }

        const callResult = await this.callFunc(funcName, funcArgs);
        if (callResult.isFailure) {
            return Result.fail(
                `this.callFunc(funcName='${funcName}', funcArgs='${JSON.stringify(funcArgs)}'): ${callResult.errorTitle}`,
                callResult.errorDescription!
            )
        }

        return Result.ok(callResult.getValue());
    }

    /**
     * Get the variable declaration AST tree for the variable
     * @param identifier The variable's name
     * @returns {Result<VariableDeclaration>}
     */
    private identifyVariableDeclaration = (identifier: string): Result<VariableDeclaration> => {
        const varDeclaration = this._ast.getVariableDeclaration(identifier);
        if (varDeclaration === undefined) {
            return Result.fail(
                `this.ast.getVariableDeclaration(identifier='${identifier}')`,
                `The '${identifier}' variable's declaration not found in the AST`
            );
        }

        return Result.ok(varDeclaration)
    }

    /**
     * Given the argument, its the variable name, find the line where this variable was declared and
     * get its value.
     * @param {string} identifier the variable name
     * @param {boolean} identifyUpdates whether to look up for the changes?
     * @returns {error?: string, data?: T}
     */
    private identifyVariable = async <T>(identifier: string, memory: ModuleMemory<T>, identifyUpdates: boolean = true): Promise<Result<ValueType>> => {
        // If Attribute name is an identifier, get variable statements that define them:
        // For example `const v: number = 1`
        const varDeclaration = this.identifyVariableDeclaration(identifier);
        if (varDeclaration.isFailure) {
            return Result.fail(
                `this.identifyVariableDeclaration(identifier='${identifier}'): ${varDeclaration.errorTitle}`,
                varDeclaration.errorDescription!
            );
        }

        const lastChild = varDeclaration.getValue().getLastChild();
        Debug.log(`Assign '${lastChild?.getText()}' result to '${identifier}' variable`)

        Debug.push(`this.identifyValueType(lastChild='${lastChild?.getText()}')`)
        const identfiedValueType = this.identifyValueType(lastChild!);
        Debug.pop();
        if (identfiedValueType.isFailure) {
            return Result.fail(
                `lastChild='${lastChild?.getText()}'/this.identifyValueType(lastChild='${lastChild?.getText()}'): ${identfiedValueType.errorTitle}`,
                identfiedValueType.errorDescription!
            )
        }
        const randomValue = this.emptyValueByType(identifier, identfiedValueType.getValue())
        if (randomValue.isFailure) {
            return Result.fail(
                `lastChild='${lastChild?.getText()}'/this.exactValueType(identifier='${identifier}'), idenfierValueType='${identfiedValueType.getValue()}': ${randomValue.errorTitle}`,
                randomValue.errorDescription!
            )
        }
        const value = randomValue.getValue();
        Debug.log(`The '${identifier}' identifier needs '${lastChild?.getText()}' expression, type: '${ValueTypeString[identfiedValueType.getValue()]}', current: '${JSON.stringify(value)}' value`)
        Debug.push(`this.identifyValue(indetifier='${identifier}',value='${JSON.stringify(value)}',lastChild='${lastChild?.getText()}')`)
        const identifiedValue = await this.identifyValue(identifier, value, identfiedValueType.getValue(), lastChild!, memory);
        Debug.pop();
        Debug.log(`The '${identifier}' identified value = '${JSON.stringify(identifiedValue)}'`)
        if (identifiedValue.isFailure) {
            return Result.fail(
                `identifyVariable(identifier='${identifier}'): ${identifiedValue.errorTitle}`,
                identifiedValue.errorDescription!
            )
        }

        if (!identifyUpdates) {
            return Result.ok(identifiedValue.getValue())
        }


        Debug.log(`Update the '${identifier}' variable with current data '${JSON.stringify(identifiedValue.getValue())}' if there are any updates`)
        Debug.push(`this.identifyVariableUpdates<typeof value>(identifier='${identifier}',identifiedValue='${JSON.stringify(identifiedValue)}')`)
        const updated = await this.identifyVariableUpdates(identifier, identifiedValue.getValue()!, identifiedValue.getValue(), memory);
        Debug.pop();
        Debug.log(`identifyVariable <- identifyVariableUpdates, updated. The '${identifier}' variable updated data '${JSON.stringify(updated)}'`)
        if (updated.isFailure) {
            return Result.fail(
                `identifyVariableUpdates(identifier=${identifier}, data=${identifiedValue.getValue()}): ${updated.errorTitle}`,
                updated.errorDescription!
            )
        }

        return Result.ok(updated.getValue());
    }

    private exactIdentifier = (exp: any, identifier: string): string => {
        if (exp instanceof PropertyAssignment) {
            return exp.getFirstChild()!.getText();
        } else if (exp instanceof SpreadAssignment) {
            return exp.getLastChild()!.getText();
        } else if (exp instanceof ShorthandPropertyAssignment) {
            return exp.getText();
        }
        return identifier;
    }

    private exactValueNode = (exp: Node): Node => {
        if (exp instanceof PropertyAssignment) {
            return exp.getLastChild!()!;
        } else if (exp instanceof SpreadAssignment) {
            return exp.getLastChild!()!;
        } else if (exp instanceof ShorthandPropertyAssignment) {
            return exp;
        }

        return exp;
    }

    private emptyValueByType = (identifier: string, val: ValueTypeString|ValueType): Result<ValueType> => {
        if (!Object.values(ValueTypeString).includes(val as ValueTypeString)) {
            if (Array.isArray(val)) {
                return Result.ok([] as ValueType[]);
            } else if (typeof val === "object") {
                return Result.ok({} as Object);
            } else {
                return Result.fail(
                    `Only custom Arrays and Objects are supported to generate sample data`,
                    `The '${typeof val}' type is not supported for '${identifier}', update the exactValueType()`
                )
            }
        }

        if (val == ValueTypeString.default) {
            return Result.ok({});
        }

        if (val == ValueTypeString.array) {
            return Result.ok([] as ValueType[])
        }
        if (val === ValueTypeString.number) {
            return Result.ok(0 as number)
        } else if (val === ValueTypeString.string) {
            return Result.ok("" as string);
        } else if (val === ValueTypeString.object) {
            return Result.ok({})
        } else if (val === ValueTypeString.property) {
            let obj = val as Object;
            Debug.log(`Value type is property`);
            if (!(identifier in obj)) {
                Debug.log(`The '${identifier}' is not in the ${JSON.stringify(obj)}, so add it as Object type`)
                obj[identifier] = {};
            }
            return Result.ok(obj[identifier] as ValueType)
        }

        return Result.fail(
            `No matching data was found`,
            `The ${val} not handled`
        );
    }

    /**
     * Exact Value of the node by node type.
     * If node type is the not a value type string,
     * then it's considered as the Custom type.
     * The custom types converted into data.
     * 
     * If the type is a value type string,
     * then, 
     * @param identifier 
     * @param val 
     * @param data 
     * @returns 
     */
    private exactValueByType = (identifier: string, val: ValueTypeString|ValueType, data?: ValueType): Result<ValueType> => {
        if (!Object.values(ValueTypeString).includes(val as ValueTypeString)) {
            if (Array.isArray(val) || typeof val === "object") {
                return Result.ok(deepCopy(val))
            } else {
                return Result.fail(
                    `Only custom Arrays and Objects are supported to generate sample data`,
                    `The '${typeof val}' type is not supported for '${identifier}', update the exactValueType()`
                )
            }
        }

        if (val == ValueTypeString.default) {
            if (data !== undefined) {
                return Result.ok(data)
            } else {
                return Result.ok({});
            }
        }

        if (val == ValueTypeString.array) {
            return Result.ok([] as ValueType[])
        }
        if (val === ValueTypeString.number) {
            return Result.ok(0 as number)
        } else if (val === ValueTypeString.string) {
            return Result.ok("" as string);
        } else if (val === ValueTypeString.object) {
            return Result.ok(typeof data === "object" ? deepCopy(data) : {})
        } else if (val === ValueTypeString.property) {
            let obj = data as Object;
            Debug.log(`Value type is property`);
            if (!(identifier in obj)) {
                Debug.log(`The '${identifier}' is not in the ${JSON.stringify(obj)}, so add it as Object type`)
                obj[identifier] = {};
            }
            return Result.ok(obj[identifier] as ValueType)
        }

        return Result.fail(
            `No matching data was found`,
            `The ${val} not handled`
        );
    }
}
