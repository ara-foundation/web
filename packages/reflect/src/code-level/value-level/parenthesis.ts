import { Node, ParenthesizedExpression } from "ts-morph";
import { Result, ObjectTraits } from "@ara-web/p-hintjens";
import { 
    type AstNodeFilter,
    type TypedData,
    CodePieceContext,
    ValueLevel,
    type ValueLevelInterface,
    AstNodeTraits
} from "../index.js";

/**
 * Literal class identifies the literal data such as "string", 123, false, true.
 */
@ObjectTraits.staticImplements<ValueLevelInterface>()   /* this statement implements both normal interface & static interface */
export class Parenthesis {
    public static get name(): string {
        return "Parenthesis"
    }

    public static isA: AstNodeFilter = (node: Node): boolean => {
        return node instanceof ParenthesizedExpression;
    }

    public identifyValue = async (tsNode: Node, typedData?: TypedData, astNodeContext?: CodePieceContext): Promise<Result<TypedData>> => {
        if (!AstNodeTraits.isChildExist(tsNode, 2)) {
            return Result.fail(
                `The ts node must have three children`,
                `Parenthesized expression must have 3 children`,
            )    
        }
    
        const result = await ValueLevel.identifyValue(tsNode.getChildAtIndex(1)!, typedData!, astNodeContext!);
        if (result.isFailure) {
            return Result.fail(
                `this.identifyValue('${tsNode.getChildAtIndex(1)!.getText()}'): ${result.errorTitle}`,
                result.errorDescription!
            )
        }
        return Result.ok(result.getValue());
    }
}