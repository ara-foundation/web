import { deepCopy, Result, Debug } from "@ara-web/ts-enhancement";
import { TypeDeclaration, IntersectedUnionType, UnionTypeDeclaration, ValueTypeString } from "../ast-node-data.js";
import { TsNode, type TsNodeValidator } from "../ts-node.js";
import { Node, ObjectLiteralExpression } from "ts-morph";
import type { TypedData } from "../ast-node.js";
import { staticImplements, type ValueLevelInterface } from "./value-level-interface.js";
import type { AstNodeContext } from "../../memory/AstNodeContext.js";
import { ValueLevel } from "../value-level.js";
import { ReflectAraLink } from "../../ara-link/ReflectAraLink.js";

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

        for (let i = 0; i < syntaxListElements.length; i++) {
            const element = syntaxListElements[i];
            const identifiedObjectElement = await ValueLevel.identifyValue(element, {dataType: ValueTypeString.default}, astNodeContext)
            if (identifiedObjectElement.isFailure) {
                return Result.fail(
                    `ValueLevel.identifyValue('${element.getText()}'): ${identifiedObjectElement.errorTitle}`,
                    identifiedObjectElement.errorDescription!
                )
            }

            if (typedData.dataType !== ValueTypeString.default && 
                typedData.dataType !== ValueTypeString.object &&
                !(typedData.dataType instanceof UnionTypeDeclaration) &&
                !(typedData.dataType instanceof TypeDeclaration) &&
                !(typedData.dataType instanceof IntersectedUnionType) &&
                typeof typedData.dataType !== "object"
            ) {
                return Result.fail(`For now, only default value string type supported`, `Please update the ObjectLiteral.identifyObjectLiteral to support '${typedData.dataType}'`);
            }

            if (typedData.data === undefined || ReflectAraLink.isExpressionLink(typedData.data)) {
                typedData.data = {};
            }

            typedData.data = {...(typedData.data as any), ...(identifiedObjectElement.getValue().data as any)}
        }
    
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