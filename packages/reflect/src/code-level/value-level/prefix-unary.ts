import { Node, PrefixUnaryExpression } from "ts-morph";
import { Result, ObjectTraits } from "@ara-web/p-hintjens";
import { 
    ValueTypeString, 
    type IdentifiedNodeDataType, 
    type ValueType,
    TsNode, 
    type TsNodeValidator,
    type TypedData,
    AstNodeContext,
    ValueLevel,
    type ValueLevelInterface
} from "../index.js";

/**
 * Literal class identifies the literal data such as "string", 123, false, true.
 */
@ObjectTraits.staticImplements<ValueLevelInterface>()   /* this statement implements both normal interface & static interface */
export class PrefixUnary {
    public static get name(): string {
        return "PrefixUnary"
    }

    private static isSupportedPrefix: TsNodeValidator = (child: TsNode): boolean => {
        return ["!", "+", "-", "++", "--"].includes(child.getText())
    }

    private static getPrefixType = (child: TsNode): ValueTypeString => {
        const prefix = child.getText();
        if (prefix === "!") {
            return ValueTypeString.boolean;
        } else if (prefix === "+" || prefix === "-" || prefix === "++" || prefix === "---") {
            return ValueTypeString.number
        }

        return ValueTypeString.undefined
    }

    /**
     * @param prefix {data: Prefix's text, dataType: PrefixUnary.getPrefixType()}
     * @param data 
     * @returns 
     */
    private static applyPrefix = (prefix: TypedData, data: ValueType | undefined): Result<ValueType> => {
        if (prefix.dataType === ValueTypeString.boolean) {
            if (prefix.data !== "!") {
                return Result.fail(`For now applying boolean prefix supports '!' only`, 'Pass correct data');
            }

            return Result.ok(!(data as boolean))
        }

        if (prefix.dataType === ValueTypeString.number) {
            if (prefix.data === "+") {
                return Result.ok(1 * (data as number))
            }
            if (prefix.data === "-") {
                return Result.ok(-1 * (data as number));
            }
            if (prefix.data === "++") {
                return Result.ok(1 + (data as number));
            }
            if (prefix.data === "--") {
                return Result.ok((data as number) - 1)
            }

            return Result.fail(`For now applying a number prefix doesn't support '${prefix.data}'`, 'Please, pass the correct data');
        }

        return Result.fail(`For now applying '${prefix.dataType}' not supported`, `Please update PrefixUnary.applyPrefix() to support '${prefix.data}' prefix`)
    }

    private static isExpectedType = (dataType: IdentifiedNodeDataType | undefined, prefixType: ValueTypeString): Result<undefined> => {
        if (dataType !== undefined && typeof dataType === prefixType || dataType === prefixType) {
            return Result.ok()
        }

        return Result.fail(`The '${dataType}' is not expected`, `Prefix for '${prefixType}' expected, pass correct code`)
    }

    public static isPrefixUnary: TsNodeValidator = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        return node instanceof PrefixUnaryExpression;
    }

    public static isA: TsNodeValidator = (child: TsNode): boolean => {
        return this.isPrefixUnary(child);
    }

    public identifyValue = async (tsNode: TsNode, _?: TypedData, astNodeContext?: AstNodeContext): Promise<Result<TypedData>> => {
        if (!PrefixUnary.isA(tsNode)) {
            return Result.fail(`The TS Node is not a prefix unary`, `Please pass the correct value instead '${tsNode.getText()}'`)
        }

        if (!tsNode.isChildExist(0)) {
            return Result.fail(`Prefix is missing`, `Please pass the first element of property assignment`)
        }
        if (!tsNode.isChildExist(1)) {
            return Result.fail(`Prefixed node is missing`, `Please pass the second element of property assignment`)
        }

        const prefix = tsNode.getChild(0)!;
        const value = tsNode.getChild(1)!;

        if (!PrefixUnary.isSupportedPrefix(prefix)) {
            return Result.fail(`The '${prefix.getText()}' not supported prefix`, `Please update PrefixUnary.identifyValue() to support new prefix type`)
        }

        const valueType = PrefixUnary.getPrefixType(prefix);
        if (valueType === ValueTypeString.undefined) {
            return Result.fail(`PrefixUnary.getPrefixType('${prefix.getText()}'): undefined`, `Update the PrefixUnary.getPrefixType() to fix the mistake`)
        }

        const identifiedValue = await ValueLevel.identifyValue(value, {dataType: valueType}, astNodeContext!);
        if (identifiedValue.isFailure) {
            return Result.fail(
                `ValueLevel.identifyValue('${value.getText()}'): ${identifiedValue.errorTitle}`,
                identifiedValue.errorDescription!
            )
        }

        const expectedType = PrefixUnary.isExpectedType(identifiedValue.getValue().dataType, valueType);
        if (expectedType.isFailure) {
            return Result.fail(
                `PrefixUnary.isExpectedType(): ${expectedType.errorTitle}`,
                expectedType.errorDescription!
            )
        }

        const prefixApplied = PrefixUnary.applyPrefix({data: prefix.getText(), dataType: valueType}, identifiedValue.getValue().data);
        if (prefixApplied.isFailure) {
            return Result.fail(
                `PrefixUnary.applyPrefix(): ${prefixApplied.errorTitle}`,
                prefixApplied.errorDescription!
            )
        }

        return Result.ok({data: prefixApplied.getValue(), dataType: valueType})
    }
}