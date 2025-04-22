import { Debug, deepCopy, Result } from "@ara-web/ts-enhancement";
import { ValueTypeString, type ValueType } from "../ast-node-data.js";
import { TsNode, type TsNodeValidator } from "../ts-node.js";
import { Node, ObjectLiteralExpression } from "ts-morph";
import type { TypedData } from "../ast-node.js";
import { staticImplements, type ValueLevelInterface } from "./value-level-interface.js";
import type { AstNodeContext } from "../../memory/AstNodeContext.js";
import { ValueLevel } from "../value-level.js";

/**
 * Literal class identifies the object literals
 */
@staticImplements<ValueLevelInterface>()   /* this statement implements both normal interface & static interface */
export class ObjectLiteral {
    public static get name(): string {
        return "ObjectLiteral"
    }

    public static isA: TsNodeValidator = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        return node instanceof ObjectLiteralExpression;
    }

    public identifyValue = async (tsNode: TsNode, typedData?: TypedData, astNodeContext?: AstNodeContext): Promise<Result<TypedData>> => {
        const syntaxLists = tsNode.getChildren([TsNode.isSyntaxList])!;
        if (syntaxLists.length !== 1) {
            return Result.fail(`tsNode.getChildren([TsNode.isSyntaxList]): expected 1 syntax list`, `There must be one syntax list, while node has ${syntaxLists.length}`)
        }
        
        const identified = await this.identifyObjectLiteral(typedData!, syntaxLists[0], astNodeContext!);
        if (identified.isFailure) {
            return Result.fail(
                `this.identifyObjectLiteral(): ${identified.errorTitle}`,
                identified.errorDescription!
            )
        } else {
            const copied = deepCopy(identified.getValue().data as object);
            Debug.log(`Object literal returns back to call the copy as:`);
            Debug.log(copied);
            return Result.ok({data: copied, dataType: identified.getValue().dataType})
        }        
    }

    /**
         * ObjectLiteralExpression has three children:
         * @child {Node} '{'
         * @child {SyntaxList} anything
         * @child Node '}'
         */
    private identifyObjectLiteral = async(typedData: TypedData, syntaxList: TsNode, astNodeContext: AstNodeContext): Promise<Result<TypedData>> => {
        const syntaxListElements = syntaxList.getChildren([], [TsNode.isNonImportant], [","]);
        if (typedData.data === undefined) {
            const exactData = ValueLevel.exactValueByType(typedData);
            if (exactData.isFailure) {
                return Result.fail(
                    `ValueLevel.exactValueByType(): ${exactData.errorTitle}`,
                    exactData.errorDescription!
                )
            } else {
                typedData.data = exactData.getValue();
            }
        }

        Debug.log(`The object has ${syntaxListElements.length} elements:`);
        const dataElements: ValueType[] = [];
        const dataElementTypes: ValueTypeString|ValueType[] = [];
        const proeprtyIdentifiers: string[] = [];
        for (let i = 0; i < syntaxListElements.length; i++) {
            const element = syntaxListElements[i];
            Debug.log(`The object element:`)
            Debug.log(element);
            // Debug.push(`identifyValueType()`, {exp: element.getText()})
            const childValueType = ValueLevel.getValueTypeString(element);
            Debug.log(`The '${element.getText()}' value type:`);
            Debug.log(childValueType)
            // Debug.pop()
            if (childValueType.isFailure) {
                return Result.fail(
                    `syntaxList('${syntaxList.getText()}')/this.identifyValueType(child='${element.getText()}';i=${i}): ${childValueType.errorTitle}`,
                    childValueType.errorDescription!
                )
            }

            const identifiedObjectElement = await ValueLevel.identifyValue(element, {dataType: ValueTypeString.default}, astNodeContext)
            Debug.log(`Identified object element result:`)
            Debug.log(identifiedObjectElement)
            Debug.log(`The typed data:`)
            Debug.log(typedData)
            if (identifiedObjectElement.isFailure) {
                return Result.fail(
                    `ValueLevel.identifyValue('${element.getText()}'): ${identifiedObjectElement.errorTitle}`,
                    identifiedObjectElement.errorDescription!
                )
            }

            if (typedData.dataType !== ValueTypeString.default) {
                return Result.fail(`For now, only default value string type supported`, `Please update the ObjectLiteral.identifyObjectLiteral to support '${typedData.dataType}'`);
            }

            if (typedData.data === undefined) {
                typedData.data = {};
            }

            typedData.data = {...(typedData.data as any), ...(identifiedObjectElement.getValue().data as any)}
                // const exactIdentifier = this.exactIdentifier(element, identifier!);
                // const exactExp = this.exactValueNode(element);
                // if (childValueType.getValue() === ValueTypeString.property) {
                //     if (!(exactIdentifier in (data as any))) {
                //         const err = Debug.error(
                //             `The '${exactIdentifier}' property is not found in the object data`,
                //             `Make sure that data and data type has the property from the element expression`,
                //             {object: data, elementExpression: element.getText()},
                //         )
                //         return Result.fail(err)
                //     }
                //     const propertyValue = deepCopy((data as any)[exactIdentifier])
                //     const propertyValueType = this.identifyDataValueType(propertyValue)
                //     if (propertyValueType.isFailure) {
                //         const err = Debug.error(
                //             `this.identifyDataValueType(): ${propertyValueType.errorTitle}`,
                //             propertyValueType.errorDescription!,
                //             {
                //                 data,
                //                 propertyIdentifier: exactIdentifier,
                //                 propertyValue: propertyValue,
                //                 propertyType: typeof ((data as any)[exactIdentifier])
                //             }
                //         )
                //         return Result.fail(err);
                //     }
                //     dataElements.push(propertyValue)
                //     dataElementTypes.push(propertyValueType.getValue())
                //     proeprtyIdentifiers.push(exactIdentifier)
                //     syntaxListElements[i] = exactExp;
                //     Debug.log(`The '${exactIdentifier}' property's value is ${(data as any)[exactIdentifier]}: type = '${typeof ((data as any)[exactIdentifier])}' type`)
                //     continue;
                // } else if (childValueType.getValue() !== ValueTypeString.object) {
                //     const err = Debug.error(
                //         `The element in object literal is neither property assignment nor object spread`,
                //         `update identifyObjectLiteral() to support it`,
                //         {object: data, element: element.getText(), elementExpress: element},
                //     )
    
                //     return Result.fail(err)
                // }
                // dataElements.push({})
                // dataElementTypes.push(dataType)
                // proeprtyIdentifiers.push('')
                // syntaxListElements[i] = exactExp;
            }
    
            // Debug.push(`this.identifySyntaxList()`, {syntaxListElements: `${syntaxListElements.length} elements`})
            // const identified = await this.identifySyntaxList(syntaxListElements, dataElements, dataElementTypes, memory);
            // Debug.pop();
            
            // if (identified.isFailure) {
            //     const err = Debug.error(
            //         `this.identifySyntaxList(): ${identified.errorTitle}`,
            //         identified.errorDescription!,
            //         {
            //             syntaxListElements, dataElements, dataElementTypes
            //         }
            //     )
            //     return Result.fail(err)
            // }
    
            // for (let i = 0; i < identified.getValue().length; i++) {
            //     const child = identified.getValue()[i];
            //     if (proeprtyIdentifiers[i].length > 0) {
            //         (data as any)[proeprtyIdentifiers[i]] = child;
            //     } else {
            //         (data as any) = {...deepCopy(data as object), ...deepCopy(child as any)}
            //     }
            // }
    
            Debug.log(`Identified object literal:`)
            Debug.log(typedData)
    
        if (typedData.dataType === ValueTypeString.default) {
            typedData.dataType = ValueTypeString.object;
        }
        return Result.ok({...typedData})
    }

    // private exactIdentifier = (exp: any, identifier: string): string => {
    //     if (exp instanceof PropertyAssignment) {
    //         return exp.getFirstChild()!.getText();
    //     } else if (exp instanceof SpreadAssignment) {
    //         return exp.getLastChild()!.getText();
    //     } else if (exp instanceof ShorthandPropertyAssignment) {
    //         return exp.getText();
    //     }
    //     return identifier;
    // }

    // private exactValueNode = (exp: Node): Node => {
    //     if (exp instanceof PropertyAssignment) {
    //         return exp.getLastChild!()!;
    //     } else if (exp instanceof SpreadAssignment) {
    //         return exp.getLastChild!()!;
    //     } else if (exp instanceof ShorthandPropertyAssignment) {
    //         return exp;
    //     }

    //     return exp;
    // }
}