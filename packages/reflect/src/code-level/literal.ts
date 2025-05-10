import { NumericLiteral, StringLiteral, TrueLiteral, FalseLiteral, Node } from "ts-morph";
import { Debug, Result, ObjectTraits, StringTraits } from "@ara-web/p-hintjens";
import { ValueTypeString } from "./ast-node-data.js";
import { TsNode, type TsNodeValidator } from "./ts-node.js";
import type { TypedData } from "./ast-node.js";
import { type ValueLevelInterface } from "./value-level-interface.js";
import type { AstNodeContext } from "./ast-node-context.js";

/**
 * Literal class identifies the literal data such as "string", 123, false, true.
 */
@ObjectTraits.staticImplements<ValueLevelInterface>()   /* this statement implements both normal interface & static interface */
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

    public static identifyStringLiteral = (tsNode: TsNode): Result<TypedData> => {
        if (Literal.isStringLiteral(tsNode)) {
            return Result.ok({data: StringTraits.unquote(tsNode.getText()) as string, dataType: ValueTypeString.string})
        }
        
        const err = Debug.error(
            `The '${tsNode.getText()}' as a literal value not supported by Ara Web`,
            `Please pass the correct TS Node, or update identifyLiteralValue()`,
            tsNode
        )

        return Result.fail(err);
    }

    public static identifyNumericLiteral = (tsNode: TsNode): Result<TypedData> => {
        if (Literal.isNumericLiteral(tsNode)) {
            return Result.ok({data: JSON.parse(tsNode.getText()) as number, dataType: ValueTypeString.number})
        }
        
        const err = Debug.error(
            `The '${tsNode.getText()}' as a literal value not supported by Ara Web`,
            `Please pass the correct TS Node, or update identifyLiteralValue()`,
            tsNode
        )

        return Result.fail(err);
    }
     
    public static identifyBooleanLiteral = (tsNode: TsNode): Result<TypedData> => {
        if (Literal.isBooleanLiteral(tsNode)) {
            return Result.ok({data: JSON.parse(tsNode.getText()) as boolean, dataType: ValueTypeString.boolean});
        }
        
        const err = Debug.error(
            `The '${tsNode.getText()}' as a literal value not supported by Ara Web`,
            `Please pass the correct TS Node, or update identifyLiteralValue()`,
            tsNode
        )

        return Result.fail(err);
    }

    public identifyValue = async (tsNode: TsNode, _?: TypedData, __?: AstNodeContext): Promise<Result<TypedData>> => {
        if (Literal.isStringLiteral(tsNode)) {
            return Literal.identifyStringLiteral(tsNode)
        } else if (Literal.isNumericLiteral(tsNode)) {
            return Literal.identifyNumericLiteral(tsNode)
        } else if (Literal.isBooleanLiteral(tsNode)) {
            return Literal.identifyBooleanLiteral(tsNode)
        }
        
        const err = Debug.error(
            `The '${tsNode.getText()}' as a literal value not supported by Ara Web`,
            `Please pass the correct TS Node, or update identifyLiteralValue()`,
            tsNode
        )

        return Result.fail(err);
    }
}