/**
 * The script that works with the code by turning it into the 
 * AST (Abstract Syntax Tree)
 * @todo Make the components nested to each other
 * @todo Optimize the AST traverse
 * @todo fix the parsing of all pages
 * @todo change scripts/page.ts=>Page.components type to Component
 * @todo somehow we need to show on PageModal the meta components
 */
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
import { callFuncInModule, fileContentByModulePath } from "@scripts/reflect/fileLevel";
import { unquote } from "@scripts/string";
import { Result } from "@scripts/result";

export enum AstNodeIdentity {
    Variable,
    Enum,
}

export type EnumMembers = {[key: string]: string|number};

export type IdentifiedNode = {
    id: AstNodeIdentity,
    data?: EnumMembers|any,
}

export class Code {
    ast: TsSourceFile;
    code: string;
    project: Project;
    tempCodeAmount: number;

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
        this.ast = this.project.createSourceFile(`__temp.ts`, code);
    }

    /**
     * Clone the Code with the new AST.
     * Used to evaluate various attributes by manipulating AST itself.
     * @returns {Code}
     */
    private clone = (): this => {
        return new (this.constructor as typeof Code)(this.code, this.tempCodeAmount) as this;
    }

    /**
     * Find the result of the expression, by setting it as a variable declaration.
     * @param {string} exp a JS doc that after evaluating gives the result
     * @returns {T} the result of the expression
     */
    public identifyCodePiece = async <T>(exp: string): Promise<Result<T>> => {
        this.tempCodeAmount++;
        const varName = `__ara_web_exp_${this.tempCodeAmount}`;
        let cloned = this.clone();
        cloned.ast.addVariableStatement({
            declarationKind: VariableDeclarationKind.Const, // defaults to "let"
            declarations: [{
              name: varName,
              type: "string",
              initializer: exp,
            }],
        });

        // It may be not only identifier so clone and put it in the ast
        var variable = await cloned.identifyVariable<T>(varName, false);
        // Once the _ara_web_exp is turned into the statement, get it's value.
        if (variable.isFailure) {
            return Result.fail(
                `cloned.identifyVariable(varName=${varName}): ${variable.errorTitle}`,
                variable.errorDescription!
            )
        }

        return Result.ok(variable.getValue())
    }

    /**
     * Variables values might be updated by assignment or by passing to the functions
     */
    private identifyVariableUpdates = async <T>(identifier: string, data: T): Promise<Result<T>> => {
        const updatedInFunction = this.identifyVariableUpdateInFunction<T>(identifier, data);
        if (updatedInFunction.isFailure) {
            return Result.fail(
                `this.identifyVariableUpdateInFunction(identifier=${identifier}, data=${data}): ${updatedInFunction.errorTitle}`,
                updatedInFunction.errorDescription!
            )
        }

        const updatedInAssignment = await this.identifyVariableAssignments<T>(identifier, updatedInFunction.getValue());
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
     */
    private identifyVariableAssignments = async <T>(identifier: string, data: T): Promise<Result<T>> => {
        let ret: Result<T> = Result.ok(data)

        // To make it variable assignment, make sure we track ExpressionStatements and BinaryExpressions
        for (let child of this.ast.getChildren()) {
            for (let subChild of child.getChildren()) {
                if (subChild instanceof ExpressionStatement) {
                    const res = await this.identifyExpressionStatement<T>(identifier, data, subChild)
                    if (res.isFailure) {
                        ret = Result.fail(
                            `identifyExpressionStatement(identifier=${identifier}, data=${data}, child=${subChild.getText()}): ${res.errorTitle}`,
                            res.errorDescription!
                        )
                    } else {
                        return Result.ok(res.getValue())
                    }
                } else if (subChild instanceof BinaryExpression) {
                    const res = await this.identifyBinaryExpression<T>(identifier, data, subChild)
                    if (res.isFailure) {
                        return Result.fail(
                            `identifyBinaryExpression(identifier=${identifier}, data=${data}, child=${subChild.getText()}): ${res.errorTitle}`,
                            res.errorDescription!
                        )
                    } else {
                        return Result.ok(res.getValue())
                    }
                }
            }
        }

        return Result.ok(data);
    }

    private identifyExpressionStatement = async<T>(identifier: string, data: T, exp: ExpressionStatement): Promise<Result<T>> => {
        for (let child of exp.getChildren()) {
            if (child instanceof BinaryExpression) {
                const res = await this.identifyBinaryExpression<T>(identifier, data, child);
                if (res.isFailure) {
                    return Result.fail(
                        `identifyBinaryExpression(identifier='${identifier}', data='${JSON.stringify(data)}', child='${child.getText()}'): ${res.errorTitle}`,
                        res.errorDescription!
                    )
                }
                return Result.ok(res.getValue());
            } else {
                console.log(`identifyExpressionStatement only supports BinaryExpressions for now. You gave:`);
                console.log(`Value='${child.getText()}'`);
                console.log(child)
                console.log(`\n\n`);
            }
        }

        return Result.fail(
            `Unsupported expression statement`,
            `Only Binary Expression is supported are supported for, the '${exp}' is not a binary expression'`
        )
    }

    private identifyBinaryExpression = async <T>(identifier: string, data: T, exp: BinaryExpression): Promise<Result<T>> => {
        const leftSide = exp.getChildAtIndex(0);
        const rightSide = exp.getChildAtIndex(2);
    
        if (leftSide instanceof Identifier) {
            if (leftSide.getText() !== identifier) {
                return Result.ok(data);
            }
            const result = await this.identifyValue<T>(identifier, data, rightSide)
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

            const result = await this.identifyValue<typeof propertyValue>(propertyIdentifier.getText(), propertyValue, rightSide)
            if (result.isFailure) {
                return Result.fail(
                    `leftSide('${leftSide.getText()}') as PropertyAccessExpression: this.identifyValue(propertyIdentifier='${propertyIdentifier}', propertyValue='${JSON.stringify(propertyValue)}', rightSide='${rightSide.getText()}'): ${result.errorTitle}`,
                    result.errorDescription!
                )
            }

            (data as any)[propertyIdentifier.getText()] = result.getValue()

            return Result.ok(data);
        } else {
            console.log(`identifyBinaryExpression ts='${exp.getText()}' has ${exp.getChildCount()} nodes, let's begin (NOT SUPPORTED)..`);
            console.log(`Left='${leftSide.getText()}'`);
            console.log(leftSide)
            console.log(`Right=${rightSide.getText()}`);
            console.log(rightSide);
            console.log(`\identifyBinaryExpression end`);
            return Result.fail(
                `Unsupported left side of the binary`,
                `Only Identifier or PropertyAccess are supported for now for '${leftSide.getText()}=${rightSide.getText()}'`
            )
        }
    }

    /**
     * Identify the value of the identifier. It's called when we don't know
     * what do we call, is it a variable declaration? A type declaration etc.
     * 
     * Currently supports Variable identification and enum identification.
     * @param {string} identifier identififer within the code
     */
    private identifyIdentifierRecursively = async(identifier: string): Promise<Result<IdentifiedNode>> => {
        let res = await this.identifyVariable(identifier, true);
        if (res.isSuccess) {
            return Result.ok({id: AstNodeIdentity.Variable, data: res.getValue()})
        }

        res = await this.identifyEnum(identifier);
        if (res.isSuccess) {
            return Result.ok({id: AstNodeIdentity.Enum, data: res.getValue() as EnumMembers})
        }

        if (res.isFailure) {
            // If the variable wasn't defined within the script, then find it on
            // imports.
            const importPath = this.identifyImportPath(identifier);
            if (importPath.isFailure) {
                return Result.fail(
                    `identifier not defined within this ast, this.identifyImportPath(identifier='${identifier}': ${importPath.errorTitle}`,
                    importPath.errorDescription!
                )
            }

            const fileContentData = await fileContentByModulePath(importPath.getValue());
            if (fileContentData.isFailure) {
                return Result.fail(
                    `identifier not defined within this ast, fileContentByModulePath(importPath='${importPath}'): ${fileContentData.errorTitle}`,
                    fileContentData.errorDescription!
                )
            }

            const subCode = new Code(fileContentData.getValue()!.source!);
            const identified = await subCode.identifyIdentifierRecursively(identifier)
            if (identified.isFailure) {
                return Result.fail(
                    `identifier not defined within this ast, subCode.identifyValueByIdentifier(identifier='${identifier}'): ${identified.errorTitle}`,
                    identified.errorDescription!
                )
            }

            return Result.ok(identified.getValue())
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
    private identifyObjectLiteral = async <T>(identifier: string|undefined, data: T, syntaxList: SyntaxList): Promise<Result<T>> => {
        for (let i = 0; i < syntaxList.getChildCount(); i++) {
            const child = syntaxList.getChildAtIndex(i);
            // Delimeter is skipped
            if (child.getText() === ",") {
                continue;
            }
            const identified = await this.identifyValue<T>(identifier, data, child);
            if (identified.isFailure) {
                return Result.fail(
                    `syntaxList('${syntaxList.getText()}')/this.identifyValue(identifier='${identifier}', data='${JSON.stringify(data)}', child='${child.getText()}';i=${i}): ${identified.errorTitle}`,
                    identified.errorDescription!
                )
            } else {
                data = {...identified.getValue()!};
            }
        }
        return Result.ok(data)
    }

    private identifyValue = async <T>(identifier: string|undefined, data: T, exp: any): Promise<Result<T>> => {
        if (exp instanceof ObjectLiteralExpression) {
            const syntaxList = exp.getChildSyntaxList()!;

            const identified = await this.identifyObjectLiteral<T>(identifier, data, syntaxList);
            if (identified.isFailure) {
                return Result.fail(
                    `this.identifyObjectLiteral<T>(identifier='${identifier}', data='${JSON.stringify(data)}', syntaxList='${syntaxList.getText()}'): ${identified.errorTitle}`,
                    identified.errorDescription!
                )
            } else {
                return Result.ok(identified.getValue())
            }
        } else if (exp instanceof SpreadAssignment) {
            const spreadSource = exp.getChildAtIndex(1);
            const identified = await this.identifyValue<T>(identifier, data, spreadSource);
            if (identified.isFailure) {
                return Result.fail(
                    `spreadAssignment('${exp.getText()}')/spreadSource('${spreadSource.getText()}')/this.identifyValue(identifier='${identifier}', data='${JSON.stringify(data)}', spreadSource='${spreadSource.getText()}'): ${identified.errorTitle}`,
                    identified.errorDescription!
                )
            } else {
                return Result.ok(identified.getValue())    
            }
        } else if (exp instanceof PropertyAssignment) { // {obj.property: val}
            const property = exp.getChildAtIndex(0);
            const value = exp.getChildAtIndex(2);
            const propertyValue = ((data as any)[property.getText()]);
            
            // Assigned value to the (data: T).object's property
            const res = await this.identifyValue<typeof propertyValue>(property.getText(), propertyValue, value);
            if (res.isFailure) {
                return Result.fail(
                    `propertyAssignment('${exp.getText()}')/this.identifyValue(property='${property.getText()}', data='${JSON.stringify(propertyValue)}', value='${value.getText()}'): ${res.errorTitle}`,
                    res.errorDescription!
                )
            }
            (data as any)[property.getText()] = res.getValue();
            return Result.ok(data);
        } else if (exp instanceof Identifier) {
            if (exp.getText() === identifier) {
                return Result.ok(data);
            } else {
                const identified = await this.identifyVariable<T>(exp.getText())
                if (identified.isFailure) {
                    return Result.fail(
                        `identifier('${exp.getText()}')/this.identifyVariable(exp='${exp.getText()}': ${identified.errorTitle}`,
                        identified.errorDescription!
                    );
                }
                return Result.ok(identified.getValue())
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
                
                if (identified.isFailure) {
                    return Result.fail(
                        `ArrayLiteralExpression('${exp.getText()}')/syntaxList('${syntaxList.getText()}')/this.identifyValue(identifier='${identifier}', data='${JSON.stringify(data)}', child='${child.getText()}';i=${i}): ${identified.errorTitle}`,
                        identified.errorDescription!
                    )
                } else {
                    (data as Array<any>)[oldIndex - 1] = identified.getValue()! as typeof dataAtIndex;
                }
            }

            return Result.ok(data);
        } else if (exp instanceof PropertyAccessExpression) {
            const varIdentifier = exp.getChildAtIndex(0);
            const propertyIdentifier = exp.getChildAtIndex(2);

            // Attempt to find the variable's value within this script            
            const identified = await this.identifyIdentifierRecursively(varIdentifier.getText());
            if (identified.isFailure) {
                return Result.fail(
                    `propertyAccessExpression('${exp.getText()}')/this.identifyIdentifierRecursively(varIdentifier='${varIdentifier.getText()}'): ${identified.errorTitle}`,
                    identified.errorDescription!
                )
            }
           
            if (identified.getValue().id === AstNodeIdentity.Enum) {
                let identifiedData = identified.getValue().data as EnumMembers;
                if (propertyIdentifier.getText() in identifiedData) {
                    return Result.ok(identifiedData[propertyIdentifier.getText()] as T)
                } else {
                    return Result.fail(
                        `Invalid enum`,
                        `The '${identifier}' is identified as property access to the Enum ${varIdentifier}. But this enum doesn't have '${propertyIdentifier.getText()}' member`
                    )
                }
            } else {
                console.log(`The identified data is not an enum, then how to use it:`);
                console.log(identified)
            }
        } else if (exp instanceof CallExpression) {
            const exprResult = await this.identifyFunctionCall<T>(exp as CallExpression);
            return exprResult;
        } else if (exp instanceof StringLiteral) {
            return Result.ok(
                unquote(exp.getText()) as T,
            )
        } else {
            console.log(`identifyValue child '${exp.getText()}'`);
            console.log(exp);
            return Result.fail(
                `Failed variable's node: '${exp.getText()}'`,
                `The '${JSON.stringify(exp.getText())}' variable value's node is not handled by Ara Web yet. Change identifyValue() to fix it`
            )
        }

        console.log(`The '${exp.getText()}' not yet supported by Ara Web`)
        console.log(exp);
        console.log(`\n\n`)
        return Result.fail(`Unsupported expression`, `The '${exp.getText()}' not yet supported by Ara Web`)
    } 

    /**
     * If the variable is updated by a function, then those functions are called by this method.
     * Returns TRUE, if no functions update the variable
     * @param data
     * @returns {error?: string, succeed: boolean}
     * @todo NOT IMPLMENETED
     */
    private identifyVariableUpdateInFunction = <T>(identifier: string, data: T): Result<T> => {
        return Result.ok(data);
    }


    /**
     * Call the function and return it's result
     * @param {string} funcName function literal
     * @param {any[]} funcArgs function argument
     * @returns {error?: string, data?: T}
     */
    private callFunc = async <T>(funcName: string, funcArgs: any[]): Promise<Result<T>> => {
        // Find the function
        const res = this.identifyImportPath(funcName);
        if (res.isFailure) {
            return Result.fail(
                `this.identifyImportPath(funcName='${funcName}'): ${res.errorTitle}`,
                res.errorDescription!
            )
        }

        const moduleRes = await callFuncInModule<T>(res.getValue(), funcName, funcArgs);
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
     * Identify the Import Path of the given identifier
     * @param {string} identifier
     * @param {ImportDeclaration} astImport 
     * @returns {string} the module path
     */
    public identifyImportPath = (identifier: string, astImport?: ImportDeclaration): Result<string> => {
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
                result = Result.ok(unquote(child.getText()))
            }
        }

        return result;
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
    private identifyFunctionCall = async <T>(exp: CallExpression): Promise<Result<T>> => {
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
                        let result = await this.identifyValue(funcArg.getText(), {}, funcArg);
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
                    let result = await this.identifyValue(subChild.getText(), {}, subChild);
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

        const callResult = await this.callFunc<T>(funcName, funcArgs);
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
        const varDeclaration = this.ast.getVariableDeclaration(identifier);
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
    private identifyVariable = async <T>(identifier: string, identifyUpdates: boolean = true): Promise<Result<T>> => {
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

        const identifiedValue = await this.identifyValue<T>(identifier, {} as T, lastChild);
        if (identifiedValue.isFailure) {
            return Result.fail(
                `identifyVariable(identifier='${identifier}'): ${identifiedValue.errorTitle}`,
                identifiedValue.errorDescription!
            )
        }

        if (!identifyUpdates) {
            return Result.ok(identifiedValue.getValue())
        }

        const updated = await this.identifyVariableUpdates<T>(identifier, identifiedValue.getValue()!);
        if (updated.isFailure) {
            return Result.fail(
                `identifyVariableUpdates(identifier=${identifier}, data=${identifiedValue.getValue()}): ${updated.errorTitle}`,
                updated.errorDescription!
            )
        }

        return Result.ok(updated.getValue());
    }
}
