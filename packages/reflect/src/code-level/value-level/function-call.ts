import { Debug } from "@ara-web/ts-enhancement/debug";
import { Result } from "@ara-web/ts-enhancement/result";
import { TsNode, type TsNodeValidator } from "../ts-node.js";
import { Node, CallExpression } from "ts-morph";
import type { TypedData } from "../ast-node.js";
import { type ValueLevelInterface } from "./value-level-interface.js";
import type { AstNodeContext } from "../../memory/AstNodeContext.js";
import { ValueLevel } from "../value-level.js";
import { ValueTypeString, type ValueType } from "../ast-node-data.js";
import { Identifier } from "./idenitifier.js";
import { PropertyAccess } from "./object-level/property-access.js";
import { ObjectTraits } from "@ara-web/ts-enhancement/traits";

/**
 * Calls the function.
 */
@ObjectTraits.staticImplements<ValueLevelInterface>()   /* this statement implements both normal interface & static interface */
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

        if (PropertyAccess.isA(identifier)) {
            // Debug.push(`this.identifyMethodCall()`, {'method': identifier.getText(), 'methodArgs': syntaxList.getText()})
            const res = await this.identifyMethodCall(identifier, funcArgs.getValue(), astNodeContext!)
            // Debug.pop();
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
        const propertyAccess = new PropertyAccess();
        const propertyValue = await propertyAccess.identifyValue(methodAccess, {dataType: ValueTypeString.default}, astNodeContext);
        if (propertyValue.isFailure) {
            return Result.fail(`propertyAccess.identifyValue('${methodAccess.getText()}'): ${propertyValue.errorTitle}`, propertyValue.errorDescription!);
        }
        if (propertyValue.getValue().dataType !== "function") {
            return Result.fail(`The '${methodAccess.getText()}' expected to be function`, `Ara Web doesn't support to call '${propertyValue.getValue().dataType}'`)
        }

        let data = await (propertyValue.getValue().data as any)(...(funcArgs.map((typedData) => typedData.data)))
        
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