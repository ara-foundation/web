import { Node, SpreadAssignment } from "ts-morph";
import { Result, ObjectTraits } from "@ara-web/p-hintjens";
import { 
    type AstNodeFilter,
    type TypedData,
    AstNodeContext,
    ValueLevel,
    type ValueLevelInterface,
    AstNodeTraits
} from "../index.js";

/**
 * Property assignment such as {...obj} of the object literals
 */
@ObjectTraits.staticImplements<ValueLevelInterface>()   /* this statement implements both normal interface & static interface */
export class SpreadLiteral {
    public static get name(): string {
        return "object-level/SpreadLiteral"
    }

    public static isA: AstNodeFilter = (node: Node): boolean => {
        return node instanceof SpreadAssignment;
    }

    public identifyValue = async (tsNode: Node, typedData?: TypedData, astNodeContext?: AstNodeContext): Promise<Result<TypedData>> => {
        if (!AstNodeTraits.isChildExist(tsNode, 1)) {
            return Result.fail(`Spread assignment must have the second element`, `Please pass the second element`)
        }
        const spreadSource = tsNode.getChildAtIndex(1)!;
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