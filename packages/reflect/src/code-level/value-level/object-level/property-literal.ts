import { Debug, Result } from "@ara-web/ts-enhancement";
import { ValueTypeString } from "../../ast-node-data.js";
import { TsNode, type TsNodeValidator } from "../../ts-node.js";
import { Node, PropertyAssignment } from "ts-morph";
import type { TypedData } from "../../ast-node.js";
import { staticImplements, type ValueLevelInterface } from "../value-level-interface.js";
import type { AstNodeContext } from "../../../memory/AstNodeContext.js";
import { ValueLevel } from "../../value-level.js";
import { Identifier } from "../idenitifier.js";

/**
 * Property assignment such as {Object.Property: <expression>}
 */
@staticImplements<ValueLevelInterface>()   /* this statement implements both normal interface & static interface */
export class PropertyLiteral {
    public static get name(): string {
        return "object-level/PropertyLiteral"
    }

    public static isA: TsNodeValidator = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        return node instanceof PropertyAssignment;
    }

    public identifyValue = async (tsNode: TsNode, typedData?: TypedData, astNodeContext?: AstNodeContext): Promise<Result<TypedData>> => {
        if (!tsNode.isChildExist(0)) {
            return Result.fail(`Property assignment has no first value`, `Please pass the first element of property assignment`)
        }
        if (!tsNode.isChildExist(2)) {
            return Result.fail(`Property assignment has no third value`, `Please pass the third element of property assignment`)
        }
        const property = tsNode.getChild(0)!;
        const value = tsNode.getChild(2)!;

        if (!Identifier.isA(property)) {
            const err = Debug.error(`The property '${property.getText()}' is not identifier`, `Ara Web supports identifiers as the property for now, please update it.`, property)
            return Result.fail(err);
        }

        // Assigned value to the (data: T).object's property
        const res = await ValueLevel.identifyValue(value, {dataType: ValueTypeString.default}, astNodeContext!);
        if (res.isFailure) {
            return Result.fail(
                `ValueLevel.identifyValue('${value.getText()}'): ${res.errorTitle}`,
                res.errorDescription!
            )
        }
        const data = {[property.getText()]: res.getValue().data};
        return Result.ok({data: data, dataType: ValueTypeString.property})
    }

}