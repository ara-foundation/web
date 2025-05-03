import { Node, ParenthesizedExpression } from "ts-morph";
import { Result, ObjectTraits } from "@ara-web/p-hintjens";
import { 
    TsNode, 
    type TsNodeValidator,
    type TypedData,
    AstNodeContext,
    ValueLevel,
    type ValueLevelInterface
} from "../index.js";

/**
 * Literal class identifies the literal data such as "string", 123, false, true.
 */
@ObjectTraits.staticImplements<ValueLevelInterface>()   /* this statement implements both normal interface & static interface */
export class Parenthesis {
    public static get name(): string {
        return "Parenthesis"
    }

    public static isA: TsNodeValidator = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        return node instanceof ParenthesizedExpression;
    }

    public identifyValue = async (tsNode: TsNode, typedData?: TypedData, astNodeContext?: AstNodeContext): Promise<Result<TypedData>> => {
        if (!tsNode.isChildExist(2)) {
            return Result.fail(
                `The ts node must have three children`,
                `Parenthesized expression must have 3 children`,
            )    
        }
    
        const result = await ValueLevel.identifyValue(tsNode.getChild(1)!, typedData!, astNodeContext!);
        if (result.isFailure) {
            return Result.fail(
                `this.identifyValue('${tsNode.getChild(1)!.getText()}'): ${result.errorTitle}`,
                result.errorDescription!
            )
        }
        return Result.ok(result.getValue());
    }
}