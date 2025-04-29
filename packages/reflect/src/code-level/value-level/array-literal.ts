import { ArrayLiteralExpression, Node } from "ts-morph";
import { Result, Debug, ObjectTraits } from "@ara-web/ts-enhancement";
import { 
    TsNode, 
    type TsNodeValidator,
    AstNodeContext,
    ValueLevel,
    type ValueType,
    type TypedData,
    type ValueLevelInterface
} from "../index.js";

/**
 * Literal class identifies the object literals
 */
@ObjectTraits.staticImplements<ValueLevelInterface>()   /* this statement implements both normal interface & static interface */
export class ArrayLiteral {
    public static get name(): string {
        return "array-level/ArrayLiteral"
    }

    public static isA: TsNodeValidator = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        return node instanceof ArrayLiteralExpression;
    }

    public identifyValue = async (tsNode: TsNode, typedData?: TypedData, astNodeContext?: AstNodeContext): Promise<Result<TypedData>> => {
        const syntaxLists = tsNode.getChildren([TsNode.isSyntaxList]);
        if (syntaxLists.length !== 1) {
            return Result.fail('The Ts Node expected to have syntax list', `The '${tsNode.getText()}' has '${syntaxLists.length}' syntax list only`)
        }

        const identified = await this.identifyArrayLiteral(syntaxLists[0], typedData!, astNodeContext!)
        if (identified.isFailure) {
            const err = Debug.error(
                `this.identifyArrayLiteral: ${identified.isFailure}`,
                identified.errorDescription!,
                syntaxLists[0]
            )
        
            return Result.fail(err)
        }
        
        return Result.ok({data: identified.getValue(), dataType: typedData?.dataType});
    }

    /**
         * ObjectLiteralExpression has three children:
         * @child {Node} '{'
         * @child {SyntaxList} anything
         * @child Node '}'
         */
    private identifyArrayLiteral = async (syntaxList: TsNode, typedData: TypedData, astNodeContext: AstNodeContext): Promise<Result<ValueType[]>> => {
        if (!Array.isArray(typedData.dataType)) {
            const err = Debug.error(
                `Data is not an array when expression is array literal`,
                `Pass to identifyArrayLiteral() the array`,
                typedData.data,
            )
            return Result.fail(err)
        }

        if (typedData.dataType.length !== 1) {
            return Result.fail(`ArrayLiteral supports the same data type for the data, please update it`, `Array's data type doesn't contain a single element`)
        }
        
        const data: ValueType[] = [];
        const elementType = (typedData.dataType as any)[0];

        const children = syntaxList.getChildren([], [TsNode.isNonImportant], [","])
        for (let elementIndex = 0; elementIndex < children.length; elementIndex++) {
            const element = children[elementIndex];
            const identified = await ValueLevel.identifyValue(element, {dataType: elementType}, astNodeContext);
            if (identified.isFailure) {
                const err = Debug.error(
                    `this.identifySyntaxList(): ${identified.errorTitle}`,
                    identified.errorDescription!,
                    element
                )
                return Result.fail(err)
            }
            if (identified.getValue().data === undefined) {
                return Result.fail(`ValueLevel.identifyValue(): data identified`, `Please pass the valid Ts node`);
            }
            data.push(identified.getValue().data!);
        }

        return Result.ok(data);
    }
}