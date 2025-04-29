import { Result } from "@ara-web/ts-enhancement/result";
import { TsNode, type TsNodeValidator } from "../../ts-node.js";
import { Node, SpreadAssignment } from "ts-morph";
import type { TypedData } from "../../ast-node.js";
import { type ValueLevelInterface } from "../value-level-interface.js";
import type { AstNodeContext } from "../../../memory/AstNodeContext.js";
import { ValueLevel } from "../../value-level.js";
import { ObjectTraits } from "@ara-web/ts-enhancement/traits";

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