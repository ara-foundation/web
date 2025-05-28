import { Node, PropertyAssignment } from "ts-morph";
import { ObjectTraits, Result, Debug } from "@ara-web/p-hintjens";
import  { 
    type TypedData,
    ValueTypeString,
    type AstNodeFilter,
    CodePieceContext,
    ValueLevel,
    Identifier,
    Literal,
    type ValueLevelInterface,
    AstNodeTraits
} from "../index.js";

/**
 * Property assignment such as Property: <expression> in the context of the object literals
 */
@ObjectTraits.staticImplements<ValueLevelInterface>()   /* this statement implements both normal interface & static interface */
export class PropertyLiteral {
    public static get name(): string {
        return "object-level/PropertyLiteral"
    }

    public static isA: AstNodeFilter = (node: Node): boolean => {
        return node instanceof PropertyAssignment;
    }

    public identifyValue = async (tsNode: Node, _?: TypedData, astNodeContext?: CodePieceContext): Promise<Result<TypedData>> => {
        if (!AstNodeTraits.isChildExist(tsNode, 0)) {
            return Result.fail(`Property assignment has no first value`, `Please pass the first element of property assignment`)
        }
        if (!AstNodeTraits.isChildExist(tsNode, 2)) {
            return Result.fail(`Property assignment has no third value`, `Please pass the third element of property assignment`)
        }
        const property = tsNode.getChildAtIndex(0)!;
        const value = tsNode.getChildAtIndex(2)!;

        if (!Identifier.isA(property) && !Literal.isStringLiteral(property)) {
            const err = Debug.error(`The property '${property.getText()}' is not identifier nor a string literal`, `Ara Web supports identifiers as the property for now, please update it.`, property)
            return Result.fail(err);
        }

        let propertyIdentifier = property.getText();
        if (Literal.isStringLiteral(property)) {
            const identifiedIdentifier = Literal.identifyStringLiteral(property);
            propertyIdentifier = identifiedIdentifier.getValue().data as string
        }

        // Assigned value to the (data: T).object's property
        const res = await ValueLevel.identifyValue(value, {dataType: ValueTypeString.default}, astNodeContext!);
        if (res.isFailure) {
            return Result.fail(
                `ValueLevel.identifyValue('${value.getText()}'): ${res.errorTitle}`,
                res.errorDescription!
            )
        }
        const data = {[propertyIdentifier]: res.getValue().data};
        return Result.ok({data: data, dataType: ValueTypeString.property})
    }

}