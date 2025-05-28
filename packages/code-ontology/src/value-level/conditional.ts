import { ConditionalExpression, Node } from "ts-morph";
import { Result, ObjectTraits } from "@ara-web/p-hintjens";
import { 
    AstNodeTraits, 
    type AstNodeFilter,
    type TypedData,
    CodePieceContext,
    ValueLevel,
    ValueTypeString,
    type ValueLevelInterface
} from "../index.js";

/**
 * Literal class identifies the literal data such as "string", 123, false, true.
 */
@ObjectTraits.staticImplements<ValueLevelInterface>()   /* this statement implements both normal interface & static interface */
export class Conditional {
    public static get name(): string {
        return "Conditional"
    }

    public static isA: AstNodeFilter = (node: Node): boolean => {
        return node instanceof ConditionalExpression;
    }

    public identifyValue = async (tsNode: Node, typedData?: TypedData, astNodeContext?: CodePieceContext): Promise<Result<TypedData>> => {
        if (!AstNodeTraits.isChildExist(tsNode, 4)) {
            return Result.fail(
                `The ts node must have four children at least`,
                `Parenthesized expression must have four children`,
            )    
        }
        const condition = tsNode.getChildAtIndex(0)!
        const trueExpression = tsNode.getChildAtIndex(2)!;
        const falseExpression = tsNode.getChildAtIndex(4)!;
                
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