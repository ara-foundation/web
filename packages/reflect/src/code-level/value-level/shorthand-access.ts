import { Node, ShorthandPropertyAssignment } from "ts-morph";
import { Result, ObjectTraits } from "@ara-web/p-hintjens";
import { 
    type AstNodeFilter,
    ValueTypeString,
    type TypedData,
    AstNodeContext,
    ValueLevel,
    Identifier,
    type ValueLevelInterface,
    AstNodeTraits
} from "../index.js";

/**
 * Property access such as Object.Property
 */
@ObjectTraits.staticImplements<ValueLevelInterface>()   /* this statement implements both normal interface & static interface */
export class ShorthandAccess {
    public static get name(): string {
        return "object-level/ShorthandAccess"
    }

    public static isA: AstNodeFilter = (node: Node): boolean => {
        return node instanceof ShorthandPropertyAssignment;
    }

    public identifyValue = async (tsNode: Node, _?: TypedData, astNodeContext?: AstNodeContext): Promise<Result<TypedData>> => {
        if (!AstNodeTraits.isChildExist(tsNode, 0)) {
            return Result.fail(`Method expects to have a children`, `Please update method access TS Node`);
        }
        const property = tsNode.getChildAtIndex(0)!;
        
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