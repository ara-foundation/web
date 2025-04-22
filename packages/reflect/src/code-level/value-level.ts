/**
 * Handles the AST Node's values
 */

import { Debug, deepCopy, Result } from "@ara-web/ts-enhancement";
import { ValueTypeString, type ValueType } from "./ast-node-data.js";
import { TsNode } from "./ts-node.js";
import { Node, ObjectLiteralExpression, SpreadAssignment, PropertyAssignment, ArrayLiteralExpression, PropertyAccessExpression, CallExpression, ShorthandPropertyAssignment, ConditionalExpression } from "ts-morph";
import { AstNodeType, type AstNode, type TypedData } from "./ast-node.js";
import type { AstNodeContext } from "../memory/AstNodeContext.js";
import { Literal } from "./value-level/literal.js";
import type { ValueLevelInterface } from "./value-level/value-level-interface.js";
import { FunctionCall } from "./value-level/function-call.js";
import { Identifier } from "./value-level/idenitifier.js";
import { ReflectAraLink } from "../ara-link/ReflectAraLink.js";
import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import { ObjectLiteral } from "./value-level/object-literal.js";
import { PropertyLiteral } from "./value-level/object-level/property-literal.js";
import { PropertyAccess } from "./value-level/object-level/property-access.js";
import { SpreadLiteral } from "./value-level/object-level/spread-literal.js";


export class ValueLevel {
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
    public static exactValueByType = (typedData: TypedData): Result<ValueType> => {
        if (!Object.values(ValueTypeString).includes(typedData.dataType as ValueTypeString)) {
            if (Array.isArray(typedData.dataType) || typeof typedData.dataType === "object") {
                return Result.ok(deepCopy(typedData.dataType))
            } else {
                return Result.fail(
                    `Only custom Arrays and Objects are supported to generate sample data`,
                    `The '${typeof typedData.dataType}' type is not supported, update the exactValueType()`
                )
            }
        }

        if (typedData.dataType == ValueTypeString.default) {
            if (typedData.data !== undefined) {
                return Result.ok(typedData.data)
            } else {
                return Result.ok({});
            }
        }

        if (typedData.dataType == ValueTypeString.array) {
            return Result.ok([] as ValueType[])
        }
        if (typedData.dataType === ValueTypeString.number) {
            return Result.ok(0 as number)
        } else if (typedData.dataType === ValueTypeString.string) {
            return Result.ok("" as string);
        } else if (typedData.dataType === ValueTypeString.object) {
            return Result.ok(typeof typedData.data === "object" ? deepCopy(typedData.data) : {})
        } else if (typedData.dataType === ValueTypeString.property) {
            // let obj = data as Object;
            // Debug.log(`Value type is property`);
            // if (!(identifier in obj)) {
                // Debug.log(`The '${identifier}' is not in the ${JSON.stringify(obj)}, so add it as Object type`)
                // obj[identifier] = {};
            // }
            // return Result.ok(obj[identifier] as ValueType)
        }

        return Result.fail(
            `No matching data was found`,
            `The ${typedData.dataType} not handled`
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
            } else if (Identifier.isA(tsNode)) {
                return Result.ok(ValueTypeString.default);
            } else if (exp instanceof ArrayLiteralExpression) {
                return Result.ok(ValueTypeString.array)
            } else if (exp instanceof PropertyAccessExpression) {
                return Result.ok(ValueTypeString.property)
            } else if (exp instanceof CallExpression) {
                return Result.ok(ValueTypeString.default);
            } else if (Literal.isStringLiteral(tsNode)) {
                return Result.ok(ValueTypeString.string)
            } else if (Literal.isBooleanLiteral(tsNode)) {
                return Result.ok(ValueTypeString.boolean)
            } else if (Literal.isNumericLiteral(tsNode)) {
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
     * Get the ValueTypeString by the given data
     * @param data 
     * @returns 
     */
    public static getValueTypeStringByData = (data?: ValueType): Result<ValueTypeString> => {
        if (data === undefined) {
            return Result.ok(ValueTypeString.undefined);
        }
        if (Array.isArray(data)) {
            return Result.ok(ValueTypeString.array)
        } else if (typeof data === "number") {
            return Result.ok(ValueTypeString.number);
        } else if (typeof data === "boolean") { // {obj.property: val}
            return Result.ok(ValueTypeString.boolean)
        } else if (typeof data === "string") {
            return Result.ok(ValueTypeString.string);
        } else if (typeof data === "object") {
            return Result.ok(ValueTypeString.object)
        }
    
        const err = Debug.error(
            `Can not detect the data's value type`,
            `The passed data is not supported by Ara Web`,
            data
        )

        return Result.fail(err)
    }

    /**
     * Identify the value of the {tsNode}, and update the ast node.
     * @returns 
     */
    public static identifyValue = async (tsNode: TsNode, typedData: TypedData, astNodeContext: AstNodeContext): Promise<Result<TypedData>> => {
    const supportedValueLevels: ValueLevelInterface[] = [
        Literal,          // "literal" | 12.2 | false
        FunctionCall,     // fooBar()
        Identifier,       // var1
        ObjectLiteral,    // {prop: val...}
        PropertyLiteral,  // prop: val
        PropertyAccess,   // obj.property
        SpreadLiteral, // {...obj}
    ]    
    
    for (let supported of supportedValueLevels) {
        if (supported.isA(tsNode)) {
            Debug.push(supported.name, {tsNode: tsNode.getText()})
            const supportedIdentifier = new supported();
            const identified = await supportedIdentifier.identifyValue(tsNode, typedData, astNodeContext);
            Debug.pop();
            if (identified.isFailure) {
                return Result.fail(`${supported.name}: identifyValue: ${identified.errorTitle}`, identified.errorDescription!);
            }
    
            return Result.ok(identified.getValue());    
        }
    }

    Debug.log(tsNode)
    return Result.errorCode404(['ValueLevel'], 'identifyValue', `${tsNode.getText()}`);
      
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
        //     
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

    /**
     * @param astNode Evaluate all the AST Node data property
     * @limitation Only supports AST Nodes that are Links to the expressions.
     * @returns 
     */
    public static identifyAstNodeData = async (astNode: AstNode, astNodeContext: AstNodeContext): Promise<Result<TypedData>> => {
        if (ReflectAraLink.isIdentifierLink(astNode.dataType)) {
            const dataType = astNodeContext.getIdentifier(astNode.dataType as AraLink<string>);
            if (dataType === undefined) {
                return Result.fail(
                    `${astNode.identifier} references to '${astNode.dataType?.toString()}' not found`,
                    `Add the type into AstNodeContext`
                )
            } else if (dataType.nodeType !== AstNodeType.Type) {
                return Result.fail(
                    `${astNode.identifier} data type is not a type`,
                    `Update valueLevel.identifyAstNodeData() to support '${dataType.nodeType}' nodes`
                )
            }
            astNode.dataType = dataType.data;
        }
        
        if (astNode.data === undefined) {
            return Result.ok({dataType: astNode.dataType, data: ValueLevel.emptyValueByType('', astNode.dataType)})
        }
    
        if (!(astNode.data instanceof AraLink)) {
            return Result.errorCode501(['Code'], 'identifyTypedData');
        }
    
        const typedData = await this.identifyExpressionLinkData(astNode, astNodeContext);
        if (typedData.isFailure) {
            return Result.fail(`this.identifyExpressionLinkData(): ${typedData.errorTitle}`, typedData.errorDescription!);
        }
    
        return Result.ok(typedData.getValue());
    }
    
    /**
     * Identify the data of the Ast Node if it's a link to the Expression
     * @param astNode
     * @returns 
     */
    private static identifyExpressionLinkData = async (astNode: AstNode, astNodeContext: AstNodeContext): Promise<Result<TypedData>> => {
        if (!ReflectAraLink.isExpressionLink(astNode.data)) {
            return Result.fail(`The argument is not an expression link`, `Pass the AraLink to the expression`)
        }
    
        const expTsNode = ReflectAraLink.getExpressionResource(astNode.data)!;
    
        if (astNode.dataType === undefined) {
            // Debug.push(`this.getValueTypeString(expTsNode='${expTsNode?.getText()}')`)
            const identifiedDataType = ValueLevel.getValueTypeString(expTsNode);
            // Debug.pop();
            if (identifiedDataType.isFailure) {
                return Result.fail(
                    `this.getValueTypeString('${expTsNode?.getText()}'): ${identifiedDataType.errorTitle}`,
                    identifiedDataType.errorDescription!
                )
            }
    
            astNode.dataType = identifiedDataType.getValue();
        }
    
        Debug.push(`this.identifyValue()`, {tsNode: expTsNode.getText()})
        const identifiedValue = await ValueLevel.identifyValue(expTsNode, astNode.typedData, astNodeContext);
        Debug.pop();
        if (identifiedValue.isFailure) {
            return Result.fail(
                `this.identifyValue(): ${identifiedValue.errorTitle}`,
                identifiedValue.errorDescription!
            )
        }
    
        return Result.ok(identifiedValue.getValue())
    }
}