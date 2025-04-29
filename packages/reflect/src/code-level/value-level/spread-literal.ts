import { Node, SpreadAssignment } from "ts-morph";
import { Result, ObjectTraits } from "@ara-web/ts-enhancement";
import { 
    TsNode, 
    type TsNodeValidator,
    type TypedData,
    AstNodeContext,
    ValueLevel,
    type ValueLevelInterface
} from "../index.js";

/**
 * Property assignment such as {...obj} of the object literals
 */
@ObjectTraits.staticImplements<ValueLevelInterface>()   /* this statement implements both normal interface & static interface */
export class SpreadLiteral {
    public static get name(): string {
        return "object-level/SpreadLiteral"
    }

    public static isA: TsNodeValidator = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        return node instanceof SpreadAssignment;
    }

    public identifyValue = async (tsNode: TsNode, typedData?: TypedData, astNodeContext?: AstNodeContext): Promise<Result<TypedData>> => {
        if (!tsNode.isChildExist(1)) {
            return Result.fail(`Spread assignment must have the second element`, `Please pass the second element`)
        }
        const spreadSource = tsNode.getChild(1)!;
        const identified = await ValueLevel.identifyValue(spreadSource, typedData!, astNodeContext!);
        if (identified.isFailure) {
            return Result.fail(
                `ValueLevel.identifyValue('${spreadSource.getText()}'): ${identified.errorTitle}`,
                identified.errorDescription!
            )
        } else {
            return Result.ok(identified.getValue())
        }
    }

}