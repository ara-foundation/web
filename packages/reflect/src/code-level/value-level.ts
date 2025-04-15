/**
 * Handles the AST Node's values
 */

import { Debug, Result } from "@ara-web/ts-enhancement";
import { ValueTypeString, type ValueType } from "./ast-node.js";

export const emptyValueByType = (identifier: string, val: ValueTypeString|ValueType): Result<ValueType> => {
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
