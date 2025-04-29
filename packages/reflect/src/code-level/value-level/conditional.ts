import { Result } from "@ara-web/ts-enhancement/result";
import { TsNode, type TsNodeValidator } from "../ts-node.js";
import { ConditionalExpression, Node } from "ts-morph";
import type { TypedData } from "../ast-node.js";
import { type ValueLevelInterface } from "./value-level-interface.js";
import type { AstNodeContext } from "../../memory/AstNodeContext.js";
import { ValueLevel } from "../value-level.js";
import { ValueTypeString } from "../ast-node-data.js";
import { ObjectTraits } from "@ara-web/ts-enhancement/traits";

/**
 * Literal class identifies the literal data such as "string", 123, false, true.
 */
@ObjectTraits.staticImplements<ValueLevelInterface>()   /* this statement implements both normal interface & static interface */
export class Conditional {
    public static get name(): string {
        return "Conditional"
    }

    public static isA: TsNodeValidator = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        return node instanceof ConditionalExpression;
    }

    public identifyValue = async (tsNode: TsNode, typedData?: TypedData, astNodeContext?: AstNodeContext): Promise<Result<TypedData>> => {
        if (!tsNode.isChildExist(4)) {
            return Result.fail(
                `The ts node must have four children at least`,
                `Parenthesized expression must have four children`,
            )    
        }
        const condition = tsNode.getChild(0)!
        const trueExpression = tsNode.getChild(2)!;
        const falseExpression = tsNode.getChild(4)!;
                
        // Debug.push(`this.identifyValue('${condition.getText()}')`)
        const conditionResult = await ValueLevel.identifyValue(condition, {dataType: ValueTypeString.boolean}, astNodeContext!);
        // Debug.pop();
                
        if (conditionResult.isFailure) {
            return Result.fail(
                `this.identifyValue('${condition.getText()}'): ${conditionResult.errorTitle}`,
                conditionResult.errorDescription!
            )
        }
        
        if (conditionResult.getValue().data as boolean) {
            const res = await ValueLevel.identifyValue(trueExpression, {dataType: typedData?.dataType}, astNodeContext!);
            if (res.isFailure) {
                return Result.fail(
                    `True: ValueLevel.identifyValue('${trueExpression.getText()}'): ${res.errorTitle}`,
                    res.errorDescription!
                );
            }
            return Result.ok(res.getValue())
        } else {
            const res = await ValueLevel.identifyValue(falseExpression, {dataType: typedData?.dataType}, astNodeContext!);
            if (res.isFailure) {
                return Result.fail(
                    `False: ValueLevel.identifyValue('${falseExpression.getText()}'): ${res.errorTitle}`,
                    res.errorDescription!
                );
            }
            return Result.ok(res.getValue())
        }       
    }
}