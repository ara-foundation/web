import { Debug, Result, StringTraits } from "@ara-web/ts-enhancement";
import { ValueTypeString } from "../ast-node-data.js";
import { TsNode, type TsNodeValidator } from "../ts-node.js";
import { NumericLiteral, StringLiteral, TrueLiteral, FalseLiteral, Node } from "ts-morph";
import type { TypedData } from "../ast-node.js";
import { staticImplements, type ValueLevelInterface } from "./value-level-interface.js";
import type { AstNodeContext } from "../../memory/AstNodeContext.js";

/**
 * Literal class identifies the literal data such as "string", 123, false, true.
 */
@staticImplements<ValueLevelInterface>()   /* this statement implements both normal interface & static interface */
export class Literal {
    public static get name(): string {
        return "Literal"
    }

    public static isStringLiteral: TsNodeValidator = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        return node instanceof StringLiteral;
    }

    public static isNumericLiteral: TsNodeValidator = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        return node instanceof NumericLiteral;
    }

    public static isBooleanLiteral: TsNodeValidator = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        if (node instanceof TrueLiteral) {
            return true;
        }
        if (node instanceof FalseLiteral) {
            return true;
        }

        return false;
    }

    public static isA: TsNodeValidator = (child: TsNode): boolean => {
        return this.isStringLiteral(child) || this.isNumericLiteral(child) || this.isBooleanLiteral(child);
    }

    public identifyValue = async (tsNode: TsNode, typedData?: TypedData, astNodeContext?: AstNodeContext): Promise<Result<TypedData>> => {
        if (Literal.isStringLiteral(tsNode)) {
            return Result.ok({data: StringTraits.unquote(tsNode.getText()) as string, dataType: ValueTypeString.string})
        } else if (Literal.isNumericLiteral(tsNode)) {
            return Result.ok({data: JSON.parse(tsNode.getText()) as number, dataType: ValueTypeString.number})
        } else if (Literal.isBooleanLiteral(tsNode)) {
            return Result.ok({data: JSON.parse(tsNode.getText()) as boolean, dataType: ValueTypeString.boolean});
        }
        
        const err = Debug.error(
            `The '${tsNode.getText()}' as a literal value not supported by Ara Web`,
            `Please pass the correct TS Node, or update identifyLiteralValue()`,
            tsNode
        )

        return Result.fail(err);
    }
}