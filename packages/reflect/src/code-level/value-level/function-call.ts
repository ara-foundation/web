import { Debug, Result } from "@ara-web/ts-enhancement";
import { TsNode, type TsNodeValidator } from "../ts-node.js";
import { Node, CallExpression, PropertyAccessExpression, SyntaxList } from "ts-morph";
import type { TypedData } from "../ast-node.js";
import { staticImplements, type ValueLevelInterface } from "./value-level-interface.js";
import type { AstNodeContext } from "../../memory/AstNodeContext.js";
import { ValueLevel } from "../value-level.js";
import { ValueTypeString, type ValueType } from "../ast-node-data.js";
import { Identifier } from "./idenitifier.js";

/**
 * Calls the function.
 */
@staticImplements<ValueLevelInterface>()   /* this statement implements both normal interface & static interface */
export class FunctionCall {
    public static get name(): string {
        return "FunctionCall"
    }

    public static isA: TsNodeValidator = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        return node instanceof CallExpression;
    }

    public identifyValue = async (tsNode: TsNode, typedData?: TypedData, astNodeContext?: AstNodeContext): Promise<Result<TypedData>> => {
        if (!tsNode.isChildExist(0)) {
            return Result.fail(`The TS Node doesn't have any children`, `Please, update the TS Node`)
        }
        if (!tsNode.isChildExist(2)) {
            return Result.fail(`The TS Node doesn't have the syntax list`, `Please, update the TS Node`)
        }
        if (!TsNode.isSyntaxList(tsNode.getChild(2)!)) {
            return Result.fail(`The TS Node for function call expects syntax list`, `Please, update the FunctionCall.identifyValue() to support '${tsNode.getChild(2)?.getText()}'`)
        }
        const identifier = tsNode.getChild(0)!;
        let syntaxList = tsNode.getChild(2)!;

        const funcArgs = await this.getFuncArgs(syntaxList, astNodeContext!);
        if (funcArgs.isFailure) {
            return Result.fail(
                `this.getFuncArgs(): ${funcArgs.errorTitle}`,
                funcArgs.errorDescription!
            )
        }

        if (TsNode.isPropertyAccess(identifier)) {
                Debug.push(`this.identifyMethodCall()`, {'method': identifier.getText(), 'methodArgs': syntaxList.getText()})
                const res = await this.identifyMethodCall(identifier, funcArgs.getValue(), astNodeContext!)
                Debug.pop();
                if (res.isFailure) {
                    return Result.fail(
                        `this.identifyMethodCall('${identifier.getText()}', syntaxList='[${syntaxList.getText()}]'): ${res.errorTitle}`,
                        res.errorDescription!
                    )
                }
                return Result.ok(res.getValue())
        } else if (!Identifier.isA(identifier)) {
            const err = Debug.error(
                `The '${identifier.getText()}' unsupported`, 
                `Ara Web supports Method Call or function name, update FunctionCall.identifyValue()`,
                identifier
            )
            return Result.fail(err);
        } else {
            Debug.log(`Call the function '${identifier.getText()}'`);
        }

        const funcName = identifier.getText();
        
    
        const callResult = await this.identifyFunctionCall(funcName, funcArgs.getValue(), astNodeContext!);
        if (callResult.isFailure) {
            return Result.fail(
                `this.identifyFunctionCall('${funcName}'): ${callResult.errorTitle}`,
                callResult.errorDescription!
            )
        }

        if (typedData?.dataType !== ValueTypeString.default) {
            if (callResult.getValue().dataType !== typedData!.dataType) {
                return Result.fail(
                    `Function returned data '${callResult.getValue().dataType}' not matching to '${typedData?.dataType}'`,
                    `Please fix the your code, or update FunctionCall.identifyValue()`
                )
            }
        }

        return Result.ok(callResult.getValue());
    }

    private getFuncArgs = async (syntaxList: TsNode, astNodeContext: AstNodeContext): Promise<Result<TypedData[]>> => {
        const funcArgs: TypedData[] = [];
        const children = syntaxList.getChildren([], [TsNode.isNonImportant], [","])
        for (let funcArg of children) {
            // Debug.push(`FuncArg: ValueLevel.identifyValue()`, {tsNode: funcArg.getText()});
            let result = await ValueLevel.identifyValue(funcArg, {}, astNodeContext!);
            // Debug.pop();
            if (result.isFailure) {
                return Result.fail(
                    `ValueLevel.identifyValue(): ${result.errorTitle}`,
                    result.errorDescription!
                )
            } else {
                funcArgs.push(result.getValue())
            }
        }

        return Result.ok(funcArgs);
    }

    /**
     * 
     * @param method 
     * @param methodArgs 
     * @param memory 
     * @returns 
     */
    private identifyMethodCall = async(methodAccess: TsNode, funcArgs: TypedData[], astNodeContext: AstNodeContext): Promise<Result<TypedData>> => {
        if (!methodAccess.isChildExist(0)) {
            return Result.fail(`Method expects to have a children`, `Please update method access TS Node`);
        }
        if (!methodAccess.isChildExist(2)) {
            return Result.fail(`Method expects to have the third child`, `Please update method access TS Node`);
        }
        const methodOwner = methodAccess.getChild(0)!;
        const funcName = methodAccess.getChild(2)!;

        if (!Identifier.isA(funcName)) {
            return Result.fail(`Method name expected to be identifier`, `Please update FunctionCall.identifyMethodCall() to support '${funcName.getText()}'`);
        }

        Debug.push(`this.identifyValue()`, {identifier: methodOwner?.getText(), data: '{}', exp: methodOwner?.getText()})
        const methodObj = await ValueLevel.identifyValue(methodOwner, {dataType: ValueTypeString.default}, astNodeContext);
        Debug.pop();
        if (methodObj.isFailure) {
            return Result.fail(
                `ValueLevel.identifyValue('${methodOwner.getText()}'): ${methodObj.errorTitle}`,
                methodObj.errorDescription!
            )
        }

        if (methodObj.getValue().dataType !== ValueTypeString.object) {
            return Result.fail(`The method data type is not an object`, `Did not expect '${methodObj.getValue().dataType}', please update ObjectLiteral.identifyValue to return correct data`);
        }
        const propertyType = typeof ((methodObj.getValue().data as any)[funcName.getText()]);
        if (propertyType !== "function") {
            return Result.fail(`The ${methodOwner.getText()}'${funcName.getText()}' expected to be function`, `Ara Web doesn't support to call '${propertyType}'`)
        }

        let data = await ((methodObj.getValue().data as any)[funcName.getText()])(...(funcArgs.map((typedData) => typedData.data)))
        
        const identifiedType = ValueLevel.getValueTypeStringByData(data);
        if (identifiedType.isFailure) {
            return Result.fail(
                `ValueLevel.getValueTypeStringByData(): ${identifiedType.isFailure}`,
                identifiedType.errorDescription!
            )
        }

        return Result.ok({data: data as ValueType, dataType: identifiedType.getValue()!});
    }
    
    
    /**
         * Call the function and return it's result
         * @param {string} funcName function literal
         * @param {any[]} funcArgs function argument
         * @returns {error?: string, data?: T}
     */
    private identifyFunctionCall = async (funcName: string, funcArgs: TypedData[], astNodeContext: AstNodeContext): Promise<Result<TypedData>> => {
        // Find the function
        const funcAstNode = astNodeContext.getIdentifier(funcName);
        if (funcAstNode === undefined) {
            return Result.fail(
                `astNodeContext.getIdentifier('${funcName}'): not found`,
                `Please post the function identity into the AstNodeContext`
            )
        }

        let data = await (funcAstNode.data as any)(...(funcArgs.map((typedData) => typedData.data)))
        
        const identifiedType = ValueLevel.getValueTypeStringByData(data);
        if (identifiedType.isFailure) {
            return Result.fail(
                `ValueLevel.getValueTypeStringByData(): ${identifiedType.isFailure}`,
                identifiedType.errorDescription!
            )
        }

        return Result.ok({data: data as ValueType, dataType: identifiedType.getValue()!});
    }
}