/**
 * Handles the AST Node's values
 */

import { Debug, Result, StringTraits } from "@ara-web/ts-enhancement";
import { AstNode, AstNodeType, ValueTypeString, type AstNodeValidator, type LiteralType, type ValueType } from "./ast-node.js";
import type { TsNode, TsNodeValidator } from "./ts-node.js";
import { NumericLiteral, StringLiteral, TrueLiteral, FalseLiteral } from "ts-morph";

export class ValueLevel {
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


    public static identifyLiteralValue = (tsNode: TsNode): Result<LiteralType> => {
        if (this.isStringLiteral(tsNode)) {
            return Result.ok(StringTraits.unquote(tsNode.getText()) as string)
        } else if (this.isNumericLiteral(tsNode)) {
            return Result.ok(JSON.parse(tsNode.getText()) as number)
        } else if (this.isBooleanLiteral(tsNode)) {
            return Result.ok(JSON.parse(tsNode.getText()) as boolean);
        }
        
        const err = Debug.error(
            `The '${tsNode.getText()}' as a literal value not supported by Ara Web`,
            `Please pass the correct TS Node, or update identifyLiteralValue()`,
            tsNode
        )

        return Result.fail(err);
    }
    

    public static emptyValueByType = (identifier: string, val: ValueTypeString|ValueType): Result<ValueType> => {
        if (!Object.values(ValueTypeString).includes(val as ValueTypeString)) {
            if (Array.isArray(val)) {
                return Result.ok([] as ValueType[]);
            } else if (typeof val === "object") {
                return Result.ok({} as Object);
            } else {
                return Result.fail(
                    `Only custom Arrays and Objects are supported to generate sample data`,
                    `The '${typeof val}' type is not supported for '${identifier}', update the exactValueType()`
                )
            }
        }

        if (val == ValueTypeString.default) {
            return Result.ok({});
        }

        if (val == ValueTypeString.array) {
            return Result.ok([] as ValueType[])
        }
        if (val === ValueTypeString.number) {
            return Result.ok(0 as number)
        } else if (val === ValueTypeString.string) {
            return Result.ok("" as string);
        } else if (val === ValueTypeString.object) {
            return Result.ok({})
        } else if (val === ValueTypeString.property) {
            let obj = val as Object;
            Debug.log(`Value type is property`);
            if (!(identifier in obj)) {
                Debug.log(`The '${identifier}' is not in the, so added an object type`);
                Debug.log(val);
                (obj as any)[identifier] = {};
            }
            return Result.ok((obj as any)[identifier] as ValueType)
        }

        return Result.fail(
            `No matching data was found`,
            `The ${val} not handled`
        );
    }
}