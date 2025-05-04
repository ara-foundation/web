import { Node, PropertyAccessExpression } from "ts-morph";
import { Result, ObjectTraits, Debug } from "@ara-web/p-hintjens";
import { 
    ValueTypeString,
    TsNode, 
    type TsNodeValidator,
    AstNodeContext,
    ValueLevel, 
    Identifier,
    type TypedData,
    type ValueLevelInterface
} from "../index.js";

/**
 * Property access such as Object.Property
 */
@ObjectTraits.staticImplements<ValueLevelInterface>()   /* this statement implements both normal interface & static interface */
export class PropertyAccess {
    public static get name(): string {
        return "object-level/PropertyAccess"
    }

    public static isA: TsNodeValidator = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        return node instanceof PropertyAccessExpression;
    }

    public identifyValue = async (tsNode: TsNode, _?: TypedData, astNodeContext?: AstNodeContext): Promise<Result<TypedData>> => {
        if (!tsNode.isChildExist(0)) {
            return Result.fail(`Method expects to have a children`, `Please update method access TS Node`);
        }
        if (!tsNode.isChildExist(2)) {
            return Result.fail(`Method expects to have the third child`, `Please update method access TS Node`);
        }
        const objIdentifier = tsNode.getChild(0)!;
        const property = tsNode.getChild(2)!;
        
        if (!Identifier.isA(property)) {
            return Result.fail(`Property expected to be identifier`, `Please update ProperyAccess.identifyValue() to support '${property.getText()}'`);
        }
        
        const obj = await ValueLevel.identifyValue(objIdentifier, {dataType: ValueTypeString.default}, astNodeContext!);
        if (obj.isFailure) {
            return Result.fail(
                `objectId: ValueLevel.identifyValue('${objIdentifier.getText()}'): ${obj.errorTitle}`,
                obj.errorDescription!
            )
        }

        if (obj.getValue().dataType !== ValueTypeString.object && obj.getValue().dataType !== ValueTypeString.default) {
            const err = Debug.error(
                `The method data type is not an object and not default`, 
                `Did not expect '${obj.getValue().dataType}', please update ObjectLiteral.identifyValue to return correct data`,
                {obj: obj, tsNode: objIdentifier}
            );
            return Result.fail(err);
        }
        
        const propertyType = typeof ((obj.getValue().data as any)[property.getText()]);
        if (propertyType === "undefined") {
            return Result.fail(`Property '${property.getText()}' is undefined in '${objIdentifier.getText()}'`)
        }        
        let data = ((obj.getValue().data as any)[property.getText()]);
        return Result.ok({data: data, dataType: propertyType});
    }
}