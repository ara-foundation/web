import { NumericLiteral, StringLiteral, TrueLiteral, FalseLiteral, Node } from "ts-morph";
import { Debug, Result, ObjectTraits, StringTraits } from "@ara-web/p-hintjens";
import { ValueTypeString } from "./code-piece-types.js";
import { type AstNodeFilter } from "./ast-node-traits.js";
import type { TypedData } from "./code-piece.js";
import { type ValueAstNode } from "./value-level-interface.js";
import type { CodePieceContext } from "./code-piece-context.js";

/**
 * Literal class identifies the literal data such as "string", 123, false, true.
 */
@ObjectTraits.staticImplements<ValueAstNode>()   /* this statement implements both normal interface & static interface */
export class Literal {
    public static get name(): string {
        return "Literal"
    }

    public static isStringLiteral: AstNodeFilter = (child: Node): boolean => {
        return child instanceof StringLiteral;
    }

    public static isNumericLiteral: AstNodeFilter = (child: Node): boolean => {
        return child instanceof NumericLiteral;
    }

    public static isBooleanLiteral: AstNodeFilter = (child: Node): boolean => {
        if (child instanceof TrueLiteral) {
            return true;
        }
        if (child instanceof FalseLiteral) {
            return true;
        }

        return false;
    }

    public static isA: AstNodeFilter = (child: Node): boolean => {
        return this.isStringLiteral(child) || this.isNumericLiteral(child) || this.isBooleanLiteral(child);
    }

    public static identifyStringLiteral = (tsNode: Node): Result<TypedData> => {
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

    public static identifyNumericLiteral = (tsNode: Node): Result<TypedData> => {
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
     
    public static identifyBooleanLiteral = (tsNode: Node): Result<TypedData> => {
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

    public identifyValue = async (tsNode: Node, _?: TypedData, __?: CodePieceContext): Promise<Result<TypedData>> => {
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