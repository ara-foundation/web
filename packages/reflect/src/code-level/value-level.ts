/**
 * Handles the AST Node's values
 */

import { Debug, Result, StringTraits } from "@ara-web/ts-enhancement";
import { ValueTypeString, type LiteralType, type ValueType } from "./ast-node-data.js";
import { TsNode, type TsNodeValidator } from "./ts-node.js";
import { NumericLiteral, StringLiteral, TrueLiteral, FalseLiteral, Node, ObjectLiteralExpression, SpreadAssignment, PropertyAssignment, ArrayLiteralExpression, PropertyAccessExpression, CallExpression, ShorthandPropertyAssignment, ConditionalExpression } from "ts-morph";
import type { AstNode, TypedData } from "./ast-node.js";
import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import { ReflectAraLink } from "../ara-link/ReflectAraLink.js";
import type { AstNodeContext } from "../memory/AstNodeContext.js";

export class ValueLevel {
    public static isStringLiteral: TsNodeValidator = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        return node instanceof StringLiteral;
    }

    public static isNumericLiteral: TsNodeValidator = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        return node instanceof NumericLiteral;
    }

    public static isBooleanLiteral: TsNodeValidator = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        if (node instanceof TrueLiteral) {
            return true;
        }
        if (node instanceof FalseLiteral) {
            return true;
        }

        return false;
    }

    public static isLiteralType: TsNodeValidator = (child: TsNode): boolean => {
        return this.isStringLiteral(child) || this.isNumericLiteral(child) || this.isBooleanLiteral(child);
    }

    public static identifyLiteralValue = (tsNode: TsNode): Result<TypedData> => {
        if (this.isStringLiteral(tsNode)) {
            return Result.ok({data: StringTraits.unquote(tsNode.getText()) as string, dataType: ValueTypeString.string})
        } else if (this.isNumericLiteral(tsNode)) {
            return Result.ok({data: JSON.parse(tsNode.getText()) as number, dataType: ValueTypeString.number})
        } else if (this.isBooleanLiteral(tsNode)) {
            return Result.ok({data: JSON.parse(tsNode.getText()) as boolean, dataType: ValueTypeString.boolean});
        }
        
        const err = Debug.error(
            `The '${tsNode.getText()}' as a literal value not supported by Ara Web`,
            `Please pass the correct TS Node, or update identifyLiteralValue()`,
            tsNode
        )

        return Result.fail(err);
    }
    
    public static emptyValueByType = (identifier: string, val: ValueTypeString|ValueType|undefined): Result<ValueType> => {
        if (val === undefined) {
            return Result.ok({});
        }
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
                Debug.log(`The '${identifier}' is not in the, so added an object type`);
                Debug.log(val);
                (obj as any)[identifier] = {};
            }
            return Result.ok((obj as any)[identifier] as ValueType)
        }

        return Result.fail(
            `No matching data was found`,
            `The ${val} not handled`
        );
    }

    /**
     * Get the possible value type of the expression
     * @param tsNode 
     * @returns 
     */
    public static getValueTypeString = (tsNode: TsNode): Result<ValueTypeString> => {
        const exp = tsNode.getNode<Node>();
        if (exp.getText() === "undefined") {
            return Result.ok(ValueTypeString.undefined);
        }
        if (exp instanceof ObjectLiteralExpression) {
                return Result.ok(ValueTypeString.object)
        } else if (exp instanceof SpreadAssignment) {
                return Result.ok(ValueTypeString.object);
            } else if (exp instanceof PropertyAssignment) { // {obj.property: val}
                return Result.ok(ValueTypeString.property)
            } else if (TsNode.isIdentifier(tsNode)) {
                return Result.ok(ValueTypeString.default);
            } else if (exp instanceof ArrayLiteralExpression) {
                return Result.ok(ValueTypeString.array)
            } else if (exp instanceof PropertyAccessExpression) {
                return Result.ok(ValueTypeString.property)
            } else if (exp instanceof CallExpression) {
                return Result.ok(ValueTypeString.default);
            } else if (this.isStringLiteral(tsNode)) {
                return Result.ok(ValueTypeString.string)
            } else if (this.isBooleanLiteral(tsNode)) {
                return Result.ok(ValueTypeString.boolean)
            } else if (this.isNumericLiteral(tsNode)) {
                return Result.ok(ValueTypeString.number)
            } else if (exp instanceof ShorthandPropertyAssignment) {
                return Result.ok(ValueTypeString.property)
            } else if (exp instanceof ConditionalExpression) {
                return Result.ok(ValueTypeString.default);
                // Debug.log(`Conditional expression '${exp.getText()}' has '${exp.getChildCount()}' children:`);
                // const condition = exp.getChildAtIndex(0);
                // const trueExpression = exp.getChildAtIndex(2);
                // const falseExpression = exp.getChildAtIndex(4);
                // Debug.log(`Todo: check '${condition.getText()}' is true (binary expression)`);
                // Debug.log(`Todo check '${trueExpression.getText()}' binary expression value`);
                // Debug.log(`Todo check '${falseExpression.getText()}' string literal value`);
            // } else if (exp instanceof BinaryExpression) {
        }
    
        Debug.log(`Identifying the value of '${exp.getText()}' not yet supported. Fill data of exp:`)
        Debug.log(exp);
    
        return Result.fail(
            `Can not detect the expression's value type`,
            `The '${exp.getText()}' is not supported by Ara Web`
        )
    }

    /**
     * Identify the value of the {tsNode}, and update the ast node.
     * @returns 
     */
    public static identifyValue = async (tsNode: TsNode, typedData: TypedData, astNodeContext: AstNodeContext): Promise<Result<TypedData>> => {
        Debug.log(`Identify the value of '${tsNode.getText()}' expression`);
        Debug.log(tsNode)

        // Expressions: "string literal", false, 12.2
        if (this.isLiteralType(tsNode)) {
            const identified = this.identifyLiteralValue(tsNode);
            if (identified.isFailure) {
                return Result.fail(`this.identifyLiteralValue('${tsNode.getText()}'): ${identified.errorTitle}`, identified.errorDescription!);
            }

            return Result.ok(identified.getValue());
        }
        return Result.errorCode501(['ValueLevel'], 'identifyValue');
        // if (exp instanceof ObjectLiteralExpression) {
        //     const syntaxList = exp.getChildSyntaxList()!;
        //     Debug.log(`'${identifier}' identifier is the object literal with syntax list(child_length=${syntaxList.getChildCount()}) = [${syntaxList.getText()}]`)
    
        //         Debug.push(`identifyObjectLiteral()`, {'identifier': identifier!, data: JSON.stringify(data), 'syntaxList': `[${syntaxList.getText()}]`})
        //         const identified = await this.identifyObjectLiteral(identifier, data, dataType, syntaxList, memory);
        //         Debug.pop()
        //         Debug.log(`identifyObjectLiteral identification result for '${identifier}' identifier = '${JSON.stringify(identified)}'`)
        //         if (identified.isFailure) {
        //             Debug.log(`The object literal identification error: ${JSON.stringify(identified.errorTitle)}, description = ${identified.errorDescription}`);
        //             return Result.fail(
        //                 `this.identifyObjectLiteral<T>(identifier='${identifier}', data='${JSON.stringify(data)}', syntaxList='${syntaxList.getText()}'): ${identified.errorTitle}`,
        //                 identified.errorDescription!
        //             )
        //         } else {
        //             return Result.ok(deepCopy(identified.getValue() as object))
        //         }
        //     } else if (exp instanceof SpreadAssignment) {
        //         const spreadSource = exp.getChildAtIndex(1);
        //         Debug.push(`exp as SpreadAssignment(spreadSource='${spreadSource.getText()}')`)
        //         const identified = await this.identifyValue(identifier, data, dataType, spreadSource, memory);
        //         Debug.pop();
        //         if (identified.isFailure) {
        //             return Result.fail(
        //                 `spreadAssignment('${exp.getText()}')/spreadSource('${spreadSource.getText()}')/this.identifyValue(identifier='${identifier}', data='${JSON.stringify(data)}', spreadSource='${spreadSource.getText()}'): ${identified.errorTitle}`,
        //                 identified.errorDescription!
        //             )
        //         } else {
        //             return Result.ok(identified.getValue())    
        //         }
        //     } else if (exp instanceof PropertyAssignment) { // {obj.property: val}
        //         Debug.log(`Property assignment '${exp.getText()}' of ${identifier} identifier`);
        //         const property = exp.getChildAtIndex(0);
        //         const value = exp.getChildAtIndex(2);
        //         Debug.push(`exp as PropertyAssignment()`, {exp: exp.getText()})
        //         const propertyValue = ((data as Object)[property.getText()]);
                
        //         const propertyIdentifier = `${identifier}.${property.getText()}`
    
        //         // Assigned value to the (data: T).object's property
        //         Debug.push(`identifyValue<${typeof propertyValue}>()`, {identifier: propertyIdentifier, data: JSON.stringify(propertyValue), exp: value.getText()})
        //         const res = await this.identifyValue(propertyIdentifier, propertyValue, dataType, value, memory);
        //         Debug.pop();
        //         Debug.pop();
        //         if (res.isFailure) {
        //             return Result.fail(
        //                 `propertyAssignment('${exp.getText()}')/this.identifyValue(property='${property.getText()}', data='${JSON.stringify(propertyValue)}', value='${value.getText()}'): ${res.errorTitle}`,
        //                 res.errorDescription!
        //             )
        //         }
        //         (data as any)[property.getText()] = res.getValue();
        //         return Result.ok(data);
        //     } else if (exp instanceof Identifier) {
        //         Debug.push(`exp as Identifier`)
        //         if (exp.getText() === "undefined") {
        //             const emptyValue = this.emptyValueByType(identifier!, dataType);
        //             Debug.pop();
        //             return Result.ok(emptyValue);
        //         } else if (exp.getText() === identifier) {
        //             Debug.log(`The '${identifier}' value is itself, so return it.`)
        //             Debug.pop();
        //             return Result.ok(data);
        //         } else {
        //             Debug.pop();
        //             return Result.ok(ReflectAraLink.linkToIdentifier(exp.getText(), this.dataTypeToLinkProperties(dataType)))
        //             // const identified = await this.identifyVariable<T>(exp.getText(), memory)
        //             // Debug.pop();
    
        //             // Debug.pop();
        //             // if (identified.isFailure) {
        //             //     return Result.fail(
        //             //         `identifier('${exp.getText()}')/this.identifyVariable(exp='${exp.getText()}': ${identified.errorTitle}`,
        //             //         identified.errorDescription!
        //             //     );
        //             // }
        //             // return Result.ok(identified.getValue())
        //         }
        //     } else if (exp instanceof ArrayLiteralExpression) {
        //         const syntaxList = exp.getChildAtIndex(1) as SyntaxList;
        //         Debug.push(`exp as ArrayLiteral()`, {syntaxList: syntaxList.getText()})
        //         const identified = await this.identifyArrayExpression(syntaxList, data, dataType, memory)
        //         Debug.pop();
    
        //         if (identified.isFailure) {
        //             const err = Debug.error(
        //                 `this.identifyArrayExpression: ${identified.isFailure}`,
        //                 identified.errorDescription!,
        //                 {
        //                     syntaxList, data, dataType
        //                 }
        //             )
    
        //             return Result.fail(err)
        //         }
    
        //         return Result.ok(data);
        //     } else if (exp instanceof PropertyAccessExpression) {
        //         const varIdentifier = exp.getChildAtIndex(0);
        //         const propertyIdentifier = exp.getChildAtIndex(2);
        //         Debug.push(`exp as PropertyAccess()`, {var: varIdentifier.getText(), property: propertyIdentifier.getText()})
        //         Debug.push(`this.identifyIdentifierRecursively()`, {identifier: varIdentifier.getText()})
        //         // Attempt to find the variable's value within this script            
        //         const identified = await this.identifyIdentifierRecursively(varIdentifier.getText(), memory);
        //         Debug.pop();
        //         if (identified.isFailure) {
        //             Debug.pop();
        //             return Result.fail(
        //                 `propertyAccessExpression('${exp.getText()}')/this.identifyIdentifierRecursively(varIdentifier='${varIdentifier.getText()}'): ${identified.errorTitle}`,
        //                 identified.errorDescription!
        //             )
        //         }
               
        //         if (identified.getValue().nodeType === AstNodeType.Enum) {
        //             let identifiedData = identified.getValue().data as EnumMembers;
        //             Debug.pop();
        //             if (propertyIdentifier.getText() in identifiedData) {
        //                 return Result.ok(identifiedData[propertyIdentifier.getText()] as ValueType)
        //             } else {
        //                 return Result.fail(
        //                     `Invalid enum`,
        //                     `The '${identifier}' is identified as property access to the Enum ${varIdentifier}. But this enum doesn't have '${propertyIdentifier.getText()}' member`
        //                 )
        //             }
        //         } else if (identified.getValue().nodeType === AstNodeType.Object) {
        //             let identifiedData = identified.getValue().data as Object;
        //             Debug.pop();
        //             if (propertyIdentifier.getText() in identifiedData) {
        //                 return Result.ok(identifiedData[propertyIdentifier.getText()] as ValueType)
        //             } else {
        //                 return Result.fail(
        //                     `Invalid enum`,
        //                     `The '${identifier}' is identified as property access to the Enum ${varIdentifier}. But this enum doesn't have '${propertyIdentifier.getText()}' member`
        //                 )
        //             }
        //         } else {
        //             Debug.log(`The identified data is not an enum nor a variable with object, then how to use it:`);
        //             Debug.log(identified)
        //             Debug.pop();
        //         }
        //     } else if (exp instanceof CallExpression) {
        //         Debug.push(`exp as Function Call`)
        //         Debug.push(`this.identifyFunctionCall()`, {'exp': exp.getText()})
        //         const exprResult = await this.identifyFunctionCall(exp as CallExpression, memory);
        //         Debug.pop();
        //         Debug.pop();
        //         if (exprResult.isFailure) {
        //             return Result.fail(
        //                 `this.identifyFunctionCall(exp: '${exp.getText()}'): ${exprResult.errorTitle}`,
        //                 exprResult.errorDescription!,
        //             )
        //         }
        //         return exprResult;
        //     } else if (exp instanceof StringLiteral) {
        //         return Result.ok(
        //             StringTraits.unquote(exp.getText()) as string,
        //         )
        //     } else if (exp instanceof ShorthandPropertyAssignment) {
        //         const propertyIdentifier = exp.getChildAtIndex(0);
        //         Debug.push(`exp as ShortHandPropertyAssignment`)
        //         // Attempt to find the variable's value within this script            
        //         const propertyValue = (data as Object)[propertyIdentifier.getText()]
        //         Debug.log(`The '${propertyIdentifier.getText()}' is the property name of ${identifier} identifier, whose value = '${JSON.stringify(data)}', and a variable in the script`)
        //         Debug.push(`this.identifyIdentifierRecursively<typeof ${typeof propertyValue}>(propertyIdentifier='${propertyIdentifier.getText()}')`)
        //         const identified = await this.identifyIdentifierRecursively<typeof propertyValue, T>(propertyIdentifier.getText(), memory);
        //         Debug.pop();
        //         Debug.log(`Property that was identified: '${propertyIdentifier.getText()}', identified result = ${JSON.stringify(identified.getValue())}, current property value = ${JSON.stringify(propertyValue)}`)
        //         Debug.log(`Property that was identified: '${propertyIdentifier.getText()}', data = ${JSON.stringify(data)}`)
        //         if (identified.isFailure) {
        //             Debug.pop();
        //             return Result.fail(
        //                 `shorthandPropertyAssignment('${exp.getText()}')/this.identifyIdentifierRecursively(propertyIdentifier='${propertyIdentifier.getText()}'): ${identified.errorTitle}`,
        //                 identified.errorDescription!
        //             )
        //         }
    
        //         (data as Object)[propertyIdentifier.getText()] = identified.getValue().data!
        //         Debug.log(`The updated object:`)
        //         Debug.log(JSON.stringify(data))
        //         Debug.pop();
    
        //         return Result.ok(data);
        //     } else if (exp instanceof ParenthesizedExpression) {
        //         const childAmount = exp.getChildCount();
        //         if (childAmount !== 3) {
        //             return Result.fail(
        //                 `ParenthesizedExpression('${exp.getText()}')`,
        //                 `Parenthesized expression must have 3 children, with '${childAmount}' children Ara Web is not supporting, contact to change identifyValue()`,
        //             )    
        //         }
    
        //         const result = await this.identifyValue(identifier, data, dataType, exp.getChildAtIndex(1), memory);
        //         if (result.isFailure) {
        //             return Result.fail(
        //                 `ParenthesizedExpression('${exp.getText()}'): this.identifyValue(identifier='${identifier}', data='${JSON.stringify(data)}', secondChild='${exp.getChildAtIndex(1).getText()}'): ${result.errorTitle}`,
        //                 result.errorDescription!
        //             )
        //         }
        //         return Result.ok(result.getValue());
        //     } else if (exp instanceof ConditionalExpression) {
        //         const condition = exp.getChildAtIndex(0);
        //         const trueExpression = exp.getChildAtIndex(2);
        //         const falseExpression = exp.getChildAtIndex(4);
        //         Debug.push(`this.identifyValue<boolean>(identifier='${identifier}_condition', data=false, exp='${condition.getText()}')`)
        //         const conditionResult = await this.identifyValue(`${identifier}_condition`, false, ValueTypeString.boolean, condition, memory);
        //         Debug.pop();
        //         if (conditionResult.isFailure) {
        //             return Result.fail(
        //                 `this.identifyValue<boolean>('${identifier}_condition', data=false, condition='${condition.getText()}'): ${conditionResult.errorTitle}`,
        //                 conditionResult.errorDescription!
        //             )
        //         }
        //         let res: Result<ValueType>;
        //         let errTitle: string;
        //         const conditionValue = conditionResult.getValue() as boolean;
        //         if (conditionValue) {
        //             res = await this.identifyValue(`${identifier}_left_side`, {}, ValueTypeString.object, trueExpression, memory);
        //             if (res.isFailure) {
        //                 errTitle = `this.identifyValue<ValueType>('${identifier}_left_side', data={}, exp='${trueExpression.getText()}'): ${res.errorTitle}`
        //             }
        //         } else {
        //             res = await this.identifyValue(`${identifier}_right_side`, {}, ValueTypeString.object, falseExpression, memory);
        //             if (res.isFailure) {
        //                 errTitle = `this.identifyValue<ValueType>('${identifier}_right_side', data={}, exp='${falseExpression.getText()}'): ${res.errorTitle}`
        //             }
        //         }
        //         if (res.isFailure) {
        //             return Result.fail(
        //                 errTitle!,
        //                 res.errorDescription!
        //             )
        //         }
        //         return Result.ok(res.getValue());
        //     } else if (exp instanceof BinaryExpression) {
        //         const op = exp.getChildAtIndex(1).getText();
        //         if (typeof data === "boolean" || this.isBooleanNode(op)) {
        //             const left = exp.getChildAtIndex(0);
        //             const right = exp.getChildAtIndex(2);
        //             const leftValue = await this.identifyValue('left_side', {}, ValueTypeString.object, left, memory);
        //             if (leftValue.isFailure) {
        //                 return Result.fail(
        //                     `this.identifyValue<object>('left_side', data={}, left='${left.getText()}'): ${leftValue.errorTitle}`,
        //                     leftValue.errorDescription!
        //                 )
        //             }
    
        //             const rightValue = await this.identifyValue('right_side', {}, ValueTypeString.object, right, memory);
        //             if (rightValue.isFailure) {
        //                 return Result.fail(
        //                     `this.identifyValue<object>('right_side', data={}, right='${left.getText()}'): ${rightValue.errorTitle}`,
        //                     rightValue.errorDescription!
        //                 )
        //             }
    
        //             const conditionValue = this.identifyConditionValue(leftValue.getValue(), op, rightValue);
        //             return Result.ok(conditionValue);
        //         } else if (this.isArithmeticNode(op)) {
        //             const left = exp.getChildAtIndex(0);
        //             const right = exp.getChildAtIndex(2);
        //             const leftValue = await this.identifyValue('left_side', {}, ValueTypeString.object, left, memory);
        //             if (leftValue.isFailure) {
        //                 return Result.fail(
        //                     `this.identifyValue<object>('left_side', data={}, left='${left.getText()}'): ${leftValue.errorTitle}`,
        //                     leftValue.errorDescription!
        //                 )
        //             }
    
        //             const rightValue = await this.identifyValue('right_side', {}, ValueTypeString.object, right, memory);
        //             if (rightValue.isFailure) {
        //                 return Result.fail(
        //                     `this.identifyValue<object>('right_side', data={}, right='${right.getText()}'): ${rightValue.errorTitle}`,
        //                     rightValue.errorDescription!
        //                 )
        //             }
    
        //             const arithResult = this.identifyArithmeticValue(leftValue.getValue(), op, rightValue.getValue());
        //             return Result.ok(arithResult);
        //         } else {
        //             Debug.log(`The unsupported boolean expression, its neither boolean nor arithmetic: '${exp.getChildAtIndex(1).getText()}'`)
        //             Debug.log(exp.getChildAtIndex(1))
        //             return Result.fail(
        //                 `Unsupported binary expression`,
        //                 `Only boolean binary expressions supported, given '${exp.getText()}' is not yet supported, update identifyValue()`
        //             )
        //         }
        //     } else if (exp instanceof PrefixUnaryExpression) {
        //         Debug.push(`exp as PrefixUnaryExpression`);
        //         const prefix = exp.getFirstChild();
        //         if (prefix?.getText() !== "!") {
        //             Debug.pop();
        //             return Result.fail(
        //                 `exp as PrefixUnaryExpression: only '!' prefix is supported`,
        //                 `The '${prefix?.getText()}' is not supported by Ara Web. Update the identifyValue() method in codeLevel`
        //             )
        //         }
        //         const trueExp = exp.getLastChild();
        //         const expIdentifier = `prefix_unary_${trueExp?.getText()}`;
        //         Debug.push(`this.identifyValue<T>(identifier: '${expIdentifier}', data: '${JSON.stringify(data)}', exp: ${trueExp?.getText()})`)
        //         const trueValueResult = await this.identifyValue(expIdentifier, data, dataType, trueExp!, memory);
        //         Debug.pop();
        //         Debug.pop();
        //         if (trueValueResult.isFailure) {
        //             return Result.fail(
        //                 `exp as PrefixUnaryExpression: this.identifyValue<T>(identifier: '${trueExp?.getText()}', data: '${JSON.stringify(data)}', exp: ${trueExp?.getText()}): ${trueValueResult.errorTitle}`,
        //                 trueValueResult.errorDescription!
        //             )
        //         }
        //         // TODO #1
        //         // cancelSlug when identifying !cancelSlug is not working.
        //         // As its the infinite recursive loop (!cancelSlug -> cancelSlug -> !canSlug by updateFunction)
        //         // Therefore, identify the variables in the module.
        //         // identify their assignment.
    
        //         // First identify the variables then update the variables by the given identifier.
        //         // And the update variable is accesses the memory.
    
        //         // TODO #2
        //         // Identify the imports in the memory.
        //         // Identify the imports as newName,
        //         // identify the type imports,
        //         // identify the type { name, name },
        //         // identify the default, and in the skobes,
        //         // Then, change recursiveValue by the value.
        //         return Result.ok(!trueValueResult.getValue())
        //     } else {
        //         Debug.log(`The '${exp.getText()}' expression is not supported by identifyValue yet:`);
        //         Debug.log(exp);
        //         return Result.fail(
        //             `Failed variable's node: '${exp.getText()}'`,
        //             `The '${exp.getText}' variable value's node is not handled by Ara Web yet. Change identifyValue() to fix it`
        //         )
        //     }
    
        //     Debug.log(`The '${exp.getText()}' not yet supported by Ara Web`)
        //     Debug.log(exp);
        //     Debug.log(`\n\n`)
        //     return Result.fail(`Unsupported expression`, `The '${exp.getText()}' not yet supported by Ara Web`)
    } 
}