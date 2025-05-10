import { Node, ObjectLiteralExpression } from "ts-morph";
import { ObjectTraits, Result } from "@ara-web/p-hintjens";
import { 
    AstNodeTraits,
    UserTypeDeclaration, 
    IntersectedUnionType, 
    UnionTypeDeclaration, 
    ValueTypeString,
    type AstNodeFilter,
    type TypedData,
    AstNodeContext,
    ValueLevel,
    ReflectLink,
    type ValueLevelInterface
} from "../index.js";

/**
 * Literal class identifies the object literals
 */
@ObjectTraits.staticImplements<ValueLevelInterface>()   /* this statement implements both normal interface & static interface */
export class ObjectLiteral {
    public static get name(): string {
        return "ObjectLiteral"
    }

    public static isA: AstNodeFilter = (node: Node): boolean => {
        return node instanceof ObjectLiteralExpression;
    }

    public identifyValue = async (tsNode: Node, typedData?: TypedData, astNodeContext?: AstNodeContext): Promise<Result<TypedData>> => {
        const syntaxLists = AstNodeTraits.getChildren(tsNode, [AstNodeTraits.isSyntaxList])!;
        if (syntaxLists.length !== 1) {
            return Result.fail(`tsNode.getChildren([Node.isSyntaxList]): expected 1 syntax list`, `There must be one syntax list, while node has ${syntaxLists.length}`)
        }

        const identified = await this.identifyObjectLiteral(typedData!, syntaxLists[0], astNodeContext!);
        if (identified.isFailure) {
            return Result.fail(
                `this.identifyObjectLiteral(): ${identified.errorTitle}`,
                identified.errorDescription!
            )
        } else {
            const copied = ObjectTraits.deepCopy(identified.getValue().data as object);
            return Result.ok({data: copied, dataType: identified.getValue().dataType})
        }        
    }

    /**
         * ObjectLiteralExpression has three children:
         * @child {Node} '{'
         * @child {SyntaxList} anything
         * @child Node '}'
         */
    private identifyObjectLiteral = async(typedData: TypedData, syntaxList: Node, astNodeContext: AstNodeContext): Promise<Result<TypedData>> => {
        const syntaxListElements = AstNodeTraits.getChildren(syntaxList, [], [AstNodeTraits.isNonImportant], [","]);
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
                !(typedData.dataType instanceof UserTypeDeclaration) &&
                !(typedData.dataType instanceof IntersectedUnionType) &&
                typeof typedData.dataType !== "object"
            ) {
                return Result.fail(`For now, only default value string type supported`, `Please update the ObjectLiteral.identifyObjectLiteral to support '${typedData.dataType}'`);
            }

            if (typedData.data === undefined || ReflectLink.isTsNodeLink(typedData.data)) {
                typedData.data = {};
            }

            typedData.data = {...(typedData.data as any), ...(identifiedObjectElement.getValue().data as any)}
        }
    
        if (typedData.dataType === ValueTypeString.default) {
            typedData.dataType = ValueTypeString.object;
        }
        return Result.ok({...typedData})
    }
}