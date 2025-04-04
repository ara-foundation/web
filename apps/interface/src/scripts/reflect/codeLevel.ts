/**
 * The script that works with the code by turning it into the 
 * AST (Abstract Syntax Tree)
 * @todo Make the components nested to each other
 * @todo fix the parsing of all pages
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
    NumericLiteral,
    ShorthandPropertyAssignment,
    CommentStatement,
    VariableStatement
} from "ts-morph";
import { callFuncInModule, fileContentByModulePath } from "@scripts/reflect/fileLevel";
import { unquote } from "@scripts/string";
import { Result } from "@scripts/result";
import { random, values } from "lodash-es";
import { Debug } from "@scripts/debug";

export enum AstNodeIdentity {
    Variable,
    Enum,
}

export type EnumMembers = {[key: string]: string|number};

export type IdentifiedNode = {
    id: AstNodeIdentity,
    data?: EnumMembers|any,
}
export type Object = {[key: string]: ValueType};

enum ValueTypeString {
    default = "default",    // The type that was passed
    string = "string",
    number = "number",
    array = "array",
    object = "object",
    property = "property",
}

export type ValueType = string | number | Array<ValueType> | Object

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
        const varName = `__temp_var_${this.tempCodeAmount}`;
        let cloned = this.clone();
        cloned.ast.addVariableStatement({
            declarationKind: VariableDeclarationKind.Const, // defaults to "let"
            declarations: [{
              name: varName,
              type: "string",
              initializer: exp,
            }],
        });

        Debug.push(`identifyCodePiece`)
        Debug.log(`Entry from other module into code level.`)
        Debug.log(`Identify '${exp}' expression, then assign to '${varName}' temporary variable.`)

        Debug.push(`identifyVariable(varName='${varName}', update=false)`)
        // It may be not only identifier so clone and put it in the ast
        var variable = await cloned.identifyVariable<T>(varName, false);
        Debug.pop()
        Debug.log(`${varName} identified value = ${JSON.stringify(variable)}.`)
        // Once the _ara_web_exp is turned into the statement, get it's value.
        Debug.pop();
        Debug.reset();

        if (variable.isFailure) {
            return Result.fail(
                `cloned.identifyVariable(varName=${varName}): ${variable.errorTitle}`,
                variable.errorDescription!
            )
        }

        return Result.ok(variable.getValue() as T)
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

        Debug.push(`identifyVariableAssingments(identifier='${identifier}', updatedInFunction='${JSON.stringify(updatedInFunction.getValue())}')`)

        const updatedInAssignment = await this.identifyVariableAssignments<T>(identifier, updatedInFunction.getValue());
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
    private identifyVariableAssignments = async <T>(identifier: string, data: T): Promise<Result<T>> => {
        let ret: Result<T> = Result.ok(data)

        // To make it variable assignment, make sure we track ExpressionStatements and BinaryExpressions
        for (let child of this.ast.getChildren()) {
            const childAmount = child.getChildCount()
            Debug.log(`There are '${childAmount}' expressions`)
            for (let subChild of child.getChildren()) {
                if (subChild instanceof ExpressionStatement) {
                    Debug.push(`expressionStatement(identifier='${identifier}',data='${JSON.stringify(data)}',subChild='${subChild.getText()}')`);
                    const res = await this.identifyExpressionStatement<T>(identifier, data, subChild)
                    Debug.pop();
                    Debug.log(`identifyExpressionStatement identified as ${JSON.stringify(res)}`);
                    if (res.isFailure) {
                        Debug.log(`return failure`);
                        return Result.fail(
                            `identifyExpressionStatement(identifier=${identifier}, data=${data}, child=${subChild.getText()}): ${res.errorTitle}`,
                            res.errorDescription!
                        )
                    } else {
                        Debug.log(`Return success`);
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
            } else if (child instanceof CallExpression) {
                Debug.log(`TODO: The call expression '${child.getText()}' not yet supported in identifyExpressionStatement`);
            } else {
                Debug.log(`identifyExpressionStatement only supports BinaryExpressions for now. You gave:`);
                Debug.log(`Value='${child.getText()}'`);
                Debug.log(child)
                Debug.log(`\n\n`);
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
            return Result.ok(result.getValue() as T);
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
     * Identify the value of the identifier. It's called when we don't know
     * what do we call, is it a variable declaration? A type declaration etc.
     * 
     * Currently supports Variable identification and enum identification.
     * @param {string} identifier identififer within the code
     */
    private identifyIdentifierRecursively = async <T>(identifier: string): Promise<Result<IdentifiedNode>> => {
        Debug.log(`Check identifier '${identifier}' value as variable first`)
        Debug.push(`identifyVariable(identifier='${identifier}', update=true)`)
        const res = await this.identifyVariable<T>(identifier, true);
        Debug.pop();
        Debug.log(`The '${identifier}' identified value '${JSON.stringify(res)}'`)
        if (res.isSuccess) {
            Debug.log(`The '${identifier}' is a variable successfully parsed, return '${JSON.stringify(res.getValue() as T)}' successfully`)
            const ok = Result.ok({id: AstNodeIdentity.Variable, data: res.getValue() as T})
            Debug.log(`The result to return back '${JSON.stringify(ok)}'`)
            return ok;
        }

        const enumRes = await this.identifyEnum(identifier);
        if (enumRes.isSuccess) {
            return Result.ok({id: AstNodeIdentity.Enum, data: enumRes.getValue() as EnumMembers})
        }

        if (enumRes.isFailure) {
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
    private identifyObjectLiteral = async <T>(identifier: string|undefined, data: T, syntaxList: SyntaxList): Promise<Result<T>> => {
        for (let i = 0; i < syntaxList.getChildCount(); i++) {
            const child = syntaxList.getChildAtIndex(i);
            const childKey = `syntaxList Child (${i+1}/${syntaxList.getChildCount()})`;
            Debug.push(childKey)
            Debug.log(`Check ${childKey} of object literal`)
            // Delimeter is skipped
            if (child.getText() === ",") {
                Debug.log(`Skip the node as its a special character`)
                Debug.pop();
                continue;
            }

            Debug.push(`identifyValueType(child='${child.getText()}')`)
            const childValueType = this.identifyValueType(child);
            Debug.pop()
            if (childValueType.isFailure) {
                Debug.pop();
                return Result.fail(
                    `syntaxList('${syntaxList.getText()}')/this.identifyValueType(child='${child.getText()}';i=${i}): ${childValueType.errorTitle}`,
                    childValueType.errorDescription!
                )
            }

            const exactIdentifier = this.exactIdentifier(child, identifier!);
            Debug.log(`For '${child.getText()}' expression of ${childValueType.getValue()} type, get exact identifier, our is '${identifier}', exact identifier = '${exactIdentifier}'`);
            Debug.push(`exactValueType(child='${exactIdentifier}', childValueType='${JSON.stringify(childValueType)}', data='${JSON.stringify(data)}')`)
            const exactValueResult = this.exactValueType<T>(exactIdentifier, childValueType.getValue(), data);
            Debug.pop()
            if (exactValueResult.isFailure) {
                Debug.pop();
                return Result.fail(
                    `syntaxList('${syntaxList.getText()}')/this.exactValueType(child='${child.getText()}';i=${i}, childValue='${childValueType.getValue()}', data='${JSON.stringify(data)}: ${exactValueResult.errorTitle}')`,
                    exactValueResult.errorDescription!
                )
            }
            const exactResult = exactValueResult.getValue();
            Debug.log(`The exact value of '${child.getText()}' is '${JSON.stringify(exactResult)}'`);

            Debug.push(`identifyValue<${typeof exactResult}>(identifier='${identifier}', exactResult='${JSON.stringify(exactResult)}',child='${child.getText()}')`)
            const identified = await this.identifyValue<T>(identifier, data, child);
            Debug.pop();
            Debug.log(`Identified '${identifier}' value as ${JSON.stringify(identified)}`)
            if (identified.isFailure) {
                Debug.pop()
                return Result.fail(
                    `syntaxList('${syntaxList.getText()}')/this.identifyValue(identifier='${identifier}', data='${JSON.stringify(data)}', child='${child.getText()}';i=${i}): ${identified.errorTitle}`,
                    identified.errorDescription!
                )
            } else {
                Debug.log(`Perhaps ${JSON.stringify(data)} is not an Object? to be assigned as ${JSON.stringify(identified.getValue())}`)
                Debug.pop()
                const value: Object = identified.getValue() as Object
                (data as Object) = {...value};
            }
        }
        return Result.ok(data)
    }

    private identifyValueType = (exp: any): Result<ValueTypeString> => {
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
            return Result.ok(ValueTypeString.object)
        } else if (exp instanceof StringLiteral) {
            return Result.ok(ValueTypeString.string)
        } else if (exp instanceof ShorthandPropertyAssignment) {
            return Result.ok(ValueTypeString.property)
        }

        return Result.fail(
            `Can not detect the expression's value type`,
            `The '${exp.getText()}' is not supported by Ara Web`
        )
    }

    private identifyValue = async <T>(identifier: string|undefined, data: T, exp: any): Promise<Result<T|ValueType>> => {
        Debug.log(`Identify the value of '${exp.getText()}' expression, optionally it's the value of '${identifier}', wich has '${JSON.stringify(data)}'`);
        if (exp instanceof ObjectLiteralExpression) {
            const syntaxList = exp.getChildSyntaxList()!;
            Debug.push(`exp as ObjectLiteral`)
            Debug.push(`SyntaxList(syntaxList='[${syntaxList.getText()}]')`)
            Debug.log(`'${identifier}' identifier is the object literal with syntax list(child_length=${syntaxList.getChildCount()}) = [${syntaxList.getText()}]`)

            Debug.push(`identifyObjectLiteral(identifier='${identifier}',data='${JSON.stringify(data)}',syntaxList='${syntaxList.getText()}')`)

            const identified = await this.identifyObjectLiteral<T>(identifier, data, syntaxList);
            Debug.pop()
            Debug.log(`identifyObjectLiteral identification result for '${identifier}' identifier = '${JSON.stringify(identified)}'`)
            Debug.pop();
            Debug.pop();
            if (identified.isFailure) {
                Debug.log(`The object literal identification error: ${JSON.stringify(identified.errorTitle)}, description = ${identified.errorDescription}`);
                return Result.fail(
                    `this.identifyObjectLiteral<T>(identifier='${identifier}', data='${JSON.stringify(data)}', syntaxList='${syntaxList.getText()}'): ${identified.errorTitle}`,
                    identified.errorDescription!
                )
            } else {
                return Result.ok(identified.getValue())
            }
        } else if (exp instanceof SpreadAssignment) {
            const spreadSource = exp.getChildAtIndex(1);
            Debug.push(`exp as SpreadAssignment(spreadSource='${spreadSource.getText()}')`)
            const identified = await this.identifyValue<T>(identifier, data, spreadSource);
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
            Debug.push(`exp as PropertyAssignment(exp='${exp.getText()}')`)
            const propertyValue = ((data as Object)[property.getText()]);
            
            const propertyIdentifier = `${identifier}.${property.getText()}`

            // Assigned value to the (data: T).object's property
            Debug.push(`identifyValue<${typeof propertyValue}>(property='${propertyIdentifier}',propertyValue='${JSON.stringify(propertyValue)}',value='${value.getText()}')`)
            const res = await this.identifyValue<typeof propertyValue>(propertyIdentifier, propertyValue, value);
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
            if (exp.getText() === identifier) {
                Debug.log(`The '${identifier}' value is itself, so return it.`)
                Debug.pop();
                return Result.ok(data);
            } else {
                Debug.push(`identifyVariable(exp='${exp.getText()}')`)
                const identified = await this.identifyVariable<T>(exp.getText())
                Debug.pop();

                Debug.pop();
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
            Debug.push(`exp as ArrayLiteral(syntaxList='${syntaxList.getText()}')`)

            let oldIndex = 0;
            for (let i = 0; i < syntaxList.getChildCount(); i++) {
                const child = syntaxList.getChildAtIndex(i);
                // Delimeter is skipped
                if (child.getText() === ",") {
                    continue;
                }
                oldIndex++;
                let dataAtIndex = (data as any[])[oldIndex-1]
                Debug.log(`Get the '${dataAtIndex}' index from '${child}' oldIndex='${oldIndex - 1}', obj: '${JSON.stringify(data)}'`)
                let identified = await this.identifyValue<ValueType>(i.toString(), dataAtIndex, child);
                
                if (identified.isFailure) {
                    Debug.pop()
                    return Result.fail(
                        `ArrayLiteralExpression('${exp.getText()}')/syntaxList('${syntaxList.getText()}')/this.identifyValue(identifier='${identifier}', data='${JSON.stringify(data)}', child='${child.getText()}';i=${i}): ${identified.errorTitle}`,
                        identified.errorDescription!
                    )
                } else {
                    (data as Array<any>)[oldIndex - 1] = identified.getValue()! as typeof dataAtIndex;
                }
            }
            Debug.pop();

            return Result.ok(data);
        } else if (exp instanceof PropertyAccessExpression) {
            const varIdentifier = exp.getChildAtIndex(0);
            const propertyIdentifier = exp.getChildAtIndex(2);
            Debug.push(`exp as PropertyAccess(${varIdentifier.getText()}.${propertyIdentifier.getText()})`)
            Debug.push(`this.identifyIdentifierRecursively(varIdentifier='${varIdentifier.getText()}')`)
            // Attempt to find the variable's value within this script            
            const identified = await this.identifyIdentifierRecursively(varIdentifier.getText());
            Debug.pop();
            if (identified.isFailure) {
                Debug.pop();
                return Result.fail(
                    `propertyAccessExpression('${exp.getText()}')/this.identifyIdentifierRecursively(varIdentifier='${varIdentifier.getText()}'): ${identified.errorTitle}`,
                    identified.errorDescription!
                )
            }
           
            if (identified.getValue().id === AstNodeIdentity.Enum) {
                let identifiedData = identified.getValue().data as EnumMembers;
                Debug.pop();
                if (propertyIdentifier.getText() in identifiedData) {
                    return Result.ok(identifiedData[propertyIdentifier.getText()] as T)
                } else {
                    return Result.fail(
                        `Invalid enum`,
                        `The '${identifier}' is identified as property access to the Enum ${varIdentifier}. But this enum doesn't have '${propertyIdentifier.getText()}' member`
                    )
                }
            } else {
                Debug.log(`The identified data is not an enum, then how to use it:`);
                Debug.log(JSON.stringify(identified))
                Debug.pop();
            }
        } else if (exp instanceof CallExpression) {
            Debug.push(`exp as Function Call`)
            Debug.push(`this.identifyFunctionCall(exp='${exp.getText()}')`)
            const exprResult = await this.identifyFunctionCall<T>(exp as CallExpression);
            Debug.pop();
            Debug.pop();
            return exprResult;
        } else if (exp instanceof StringLiteral) {
            return Result.ok(
                unquote(exp.getText()) as T,
            )
        } else if (exp instanceof ShorthandPropertyAssignment) {
            const propertyIdentifier = exp.getChildAtIndex(0);
            Debug.push(`exp as ShortHandPropertyAssignment`)
            // Attempt to find the variable's value within this script            
            const propertyValue = (data as Object)[propertyIdentifier.getText()]
            Debug.log(`The '${propertyIdentifier.getText()}' is the property name of ${identifier} identifier, whose value = '${JSON.stringify(data)}', and a variable in the script`)
            Debug.push(`this.identifyIdentifierRecursively<typeof ${typeof propertyValue}>(propertyIdentifier='${propertyIdentifier.getText()}')`)
            const identified = await this.identifyIdentifierRecursively<typeof propertyValue>(propertyIdentifier.getText());
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

            (data as Object)[propertyIdentifier.getText()] = identified.getValue().data
            Debug.log(`The updated object:`)
            Debug.log(JSON.stringify(data))
            Debug.pop();

            return Result.ok(data);
        } else {
            Debug.log(`identifyValue child '${exp.getText()}'`);
            Debug.log(exp);
            return Result.fail(
                `Failed variable's node: '${exp.getText()}'`,
                `The '${JSON.stringify(exp.getText())}' variable value's node is not handled by Ara Web yet. Change identifyValue() to fix it`
            )
        }

        Debug.log(`The '${exp.getText()}' not yet supported by Ara Web`)
        Debug.log(JSON.stringify(exp));
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
    private identifyVariable = async <T>(identifier: string, identifyUpdates: boolean = true): Promise<Result<T|ValueType>> => {
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

        Debug.push(`this.identifyValueType(lastChild='${lastChild}')`)
        const identfiedValueType = this.identifyValueType(lastChild);
        Debug.pop();
        if (identfiedValueType.isFailure) {
            return Result.fail(
                `lastChild='${lastChild?.getText()}'/this.identifyValueType(lastChild='${lastChild?.getText()}'): ${identfiedValueType.errorTitle}`,
                identfiedValueType.errorDescription!
            )
        }
        const randomValue = this.exactValueType(identifier, identfiedValueType.getValue(), {})
        if (randomValue.isFailure) {
            return Result.fail(
                `lastChild='${lastChild?.getText()}'/this.exactValueType(identifier='${identifier}'), idenfierValueType='${identfiedValueType.getValue()}': ${randomValue.errorTitle}`,
                randomValue.errorDescription!
            )
        }
        const value = randomValue.getValue();
        Debug.log(`The '${identifier}' identifier needs '${lastChild?.getText()}' expression, type: '${ValueTypeString[identfiedValueType.getValue()]}', current: '${JSON.stringify(value)}' value`)
        Debug.push(`this.identifyValue(indetifier='${identifier}',value='${JSON.stringify(value)}',lastChild='${lastChild?.getText()}')`)
        const identifiedValue = await this.identifyValue<typeof value>(identifier, value, lastChild);
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
        const updated = await this.identifyVariableUpdates<typeof value>(identifier, identifiedValue.getValue()!);
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
            return exp.getLastChild()!.getText();
        } else if (exp instanceof SpreadAssignment) {
            return exp.getLastChild()!.getText();
        }
        Debug.log(`The exact identifier of`)
        Debug.log(exp)
        return identifier;
    }


    private exactValueType = <T>(identifier: string, val: ValueTypeString, t: T): Result<T|ValueType> => {
        if (val == ValueTypeString.default) {
            return Result.ok(t);
        }

        if (val == ValueTypeString.array) {
            return Result.ok([] as ValueType[])
        }
        if (val === ValueTypeString.number) {
            return Result.ok(0 as number)
        } else if (val === ValueTypeString.string) {
            return Result.ok("" as string);
        } else if (val === ValueTypeString.object) {
            return Result.ok(t as Object)
        } else if (val === ValueTypeString.property) {
            let obj = t as Object;
            Debug.log(`Value type is property`);
            if (identifier in obj) {
                return Result.ok(obj[identifier] as ValueType)
            } else {
                return Result.fail(
                    `The value type is property, but the data is not a property`,
                    `The '${identifier}' not a property of ${JSON.stringify(t)}`
                )
            }
        }

        return Result.fail(
            `No matching data was found`,
            `The ${val} not handled`
        );
    }
}
