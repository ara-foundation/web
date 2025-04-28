import { Result } from "@ara-web/ts-enhancement/result";
import { ValueTypeString } from "../../ast-node-data.js";
import { TsNode, type TsNodeValidator } from "../../ts-node.js";
import { Node, PropertyAccessExpression } from "ts-morph";
import type { TypedData } from "../../ast-node.js";
import { staticImplements, type ValueLevelInterface } from "../value-level-interface.js";
import type { AstNodeContext } from "../../../memory/AstNodeContext.js";
import { ValueLevel } from "../../value-level.js";
import { Identifier } from "../idenitifier.js";

/**
 * Property access such as Object.Property
 */
@staticImplements<ValueLevelInterface>()   /* this statement implements both normal interface & static interface */
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
                `ValueLevel.identifyValue('${objIdentifier.getText()}'): ${obj.errorTitle}`,
                obj.errorDescription!
            )
        }
        
        if (obj.getValue().dataType !== ValueTypeString.object) {
            return Result.fail(`The method data type is not an object`, `Did not expect '${obj.getValue().dataType}', please update ObjectLiteral.identifyValue to return correct data`);
        }
        
        const propertyType = typeof ((obj.getValue().data as any)[property.getText()]);
        if (propertyType === "undefined") {
            return Result.fail(`Property '${property.getText()}' is undefined in '${objIdentifier.getText()}'`)
        }        
        let data = ((obj.getValue().data as any)[property.getText()]);
        return Result.ok({data: data, dataType: propertyType});
        // const varIdentifier = exp.getChildAtIndex(0);
        //         const propertyIdentifier = exp.getChildAtIndex(2);
        //         Debug.push(`exp as PropertyAccess()`, {var: varIdentifier.getText(), property: propertyIdentifier.getText()})
        //         Debug.push(`this.identifyIdentifierRecursively()`, {identifier: varIdentifier.getText()})
        //         // Attempt to find the variable's value within this script            
        //         const identified = await this.identifyIdentifierRecursively(varIdentifier.getText(), memory);
        //         Debug.pop();
        //         if (identified.isFailure) {
        //             Debug.pop();
        //             return Result.fail(
        //                 `propertyAccessExpression('${exp.getText()}')/this.identifyIdentifierRecursively(varIdentifier='${varIdentifier.getText()}'): ${identified.errorTitle}`,
        //                 identified.errorDescription!
        //             )
        //         }
               
        //         if (identified.getValue().nodeType === AstNodeType.Enum) {
        //             let identifiedData = identified.getValue().data as EnumMembers;
        //             Debug.pop();
        //             if (propertyIdentifier.getText() in identifiedData) {
        //                 return Result.ok(identifiedData[propertyIdentifier.getText()] as ValueType)
        //             } else {
        //                 return Result.fail(
        //                     `Invalid enum`,
        //                     `The '${identifier}' is identified as property access to the Enum ${varIdentifier}. But this enum doesn't have '${propertyIdentifier.getText()}' member`
        //                 )
        //             }
        //         } else if (identified.getValue().nodeType === AstNodeType.Object) {
        //             let identifiedData = identified.getValue().data as Object;
        //             Debug.pop();
        //             if (propertyIdentifier.getText() in identifiedData) {
        //                 return Result.ok(identifiedData[propertyIdentifier.getText()] as ValueType)
        //             } else {
        //                 return Result.fail(
        //                     `Invalid enum`,
        //                     `The '${identifier}' is identified as property access to the Enum ${varIdentifier}. But this enum doesn't have '${propertyIdentifier.getText()}' member`
        //                 )
        //             }
        //         } else {
        //             Debug.log(`The identified data is not an enum nor a variable with object, then how to use it:`);
        //             Debug.log(identified)
        //             Debug.pop();
        //         }
    }
}