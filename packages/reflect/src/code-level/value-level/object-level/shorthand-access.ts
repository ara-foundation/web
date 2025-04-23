import { Result } from "@ara-web/ts-enhancement";
import { ValueTypeString } from "../../ast-node-data.js";
import { TsNode, type TsNodeValidator } from "../../ts-node.js";
import { Node, ShorthandPropertyAssignment } from "ts-morph";
import type { TypedData } from "../../ast-node.js";
import { staticImplements, type ValueLevelInterface } from "../value-level-interface.js";
import type { AstNodeContext } from "../../../memory/AstNodeContext.js";
import { ValueLevel } from "../../value-level.js";
import { Identifier } from "../idenitifier.js";

/**
 * Property access such as Object.Property
 */
@staticImplements<ValueLevelInterface>()   /* this statement implements both normal interface & static interface */
export class ShorthandAccess {
    public static get name(): string {
        return "object-level/ShorthandAccess"
    }

    public static isA: TsNodeValidator = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        return node instanceof ShorthandPropertyAssignment;
    }

    public identifyValue = async (tsNode: TsNode, _?: TypedData, astNodeContext?: AstNodeContext): Promise<Result<TypedData>> => {
        if (!tsNode.isChildExist(0)) {
            return Result.fail(`Method expects to have a children`, `Please update method access TS Node`);
        }
        const property = tsNode.getChild(0)!;
        
        if (!Identifier.isA(property)) {
            return Result.fail(`Property expected to be identifier`, `Please update ShorthandAccess.identifyValue() to support '${property.getText()}'`);
        }
        
        const obj = await ValueLevel.identifyValue(property, {dataType: ValueTypeString.default}, astNodeContext!);
        if (obj.isFailure) {
            return Result.fail(
                `ValueLevel.identifyValue('${property.getText()}'): ${obj.errorTitle}`,
                obj.errorDescription!
            )
        }
        
        let data = {
            [property.getText()]: obj.getValue().data
        };
        return Result.ok({data: data, dataType: ValueTypeString.object});
    }
}