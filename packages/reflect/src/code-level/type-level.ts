import { Result } from "@ara-web/ts-enhancement";
import type { TypedData } from "./ast-node.js";
import { IntersectedUnionType, TypeDeclaration, UnionTypeDeclaration, ValueTypeString } from "./ast-node-data.js";

export class TypeLevel {
    /**
     * Validates the data type of the data
     * @param typedData 
     */
    public static identifyDataType = (typedData: TypedData): Result<TypedData> => {
        if (typedData.dataType === undefined) {
            if (typedData.data !== undefined) {
                return Result.fail(`The data type is undefined, expects the data to be undefined too`, `Correct the values`);
            }
            return Result.ok(typedData)
        }

        if (typedData.dataType === ValueTypeString.array) {
            if (!Array.isArray(typedData.data)) {
                return Result.fail(`The data type is array, expects the data to be array too`, `Correct the values`);
            }
            return Result.ok(typedData)
        }

        if (typedData.dataType === ValueTypeString.default) {
            typedData.dataType = typeof typedData.data as ValueTypeString; 
            return Result.ok(typedData)
        }

        if (typedData.dataType === ValueTypeString.object) {
            if (typeof typedData.data !== "object") {
                return Result.fail(`The data type is object, expects the data to be object too`, `Correct the values`);
            }
            return Result.ok(typedData);
        }

        if (typedData.dataType === ValueTypeString.boolean) {
            if (typeof typedData.data !== ValueTypeString.boolean) {
                return Result.fail(`The data type is boolean, expects the data to be boolean too`, `Correct the values`);
            }
            return Result.ok(typedData);
        }

        if (typedData.dataType === ValueTypeString.number) {
            if (typeof typedData.data !== ValueTypeString.number) {
                return Result.fail(`The data type is number, expects the data to be number too`, `Correct the values`);
            }
            return Result.ok(typedData);
        }

        if (typedData.dataType === ValueTypeString.string) {
            if (typeof typedData.data !== ValueTypeString.string) {
                return Result.fail(`The data type is string, expects the data to be string too`, `Correct the values`);
            }
            return Result.ok(typedData);
        }

        if (typedData.dataType === ValueTypeString.property) {
            return Result.fail(`The data type is property`, `Ara Web doesn't support property types, update ValueLevel.identifyDataType()`)
        }

        if (Array.isArray(typedData.dataType)) {
            if (typedData.dataType.length === 0) {
                return Result.fail(`The data type is an array, but it doesn't have any data about element types`, `Pass the correct data type`);
            }

            if (typedData.dataType.length !== 1) {
                return Result.fail(`The data type is an array, but has more than 1 data type`, `Pass the correct data type`);
            }

            if (!Array.isArray(typedData.data)) {
                return Result.fail(`The data type is an array, expects data to be array too`, `Correct the values`);
            }

            const elementType = typedData.dataType[0];
            for (let elementIndex = 0; elementIndex < typedData.data.length; elementIndex++) {
                const element = typedData.data[elementIndex];
                const identifiedElement = this.identifyDataType({data: element, dataType: elementType});
                if (identifiedElement.isFailure) {
                    return Result.fail(`${elementIndex} element) ${identifiedElement.errorTitle}`, identifiedElement.errorDescription!);
                }
            }

            return Result.ok(typedData);
        }

        if (typedData.dataType instanceof TypeDeclaration) {
            const identified = typedData.dataType.identifyData(typedData.data);
            if (identified.isFailure) {
                return Result.fail(`TypeDeclaration.identifyData(): ${identified.errorTitle}`, identified.errorDescription!)
            }
        } else if (typedData.dataType instanceof UnionTypeDeclaration) {
            const identified = typedData.dataType.identifyData(typedData.data);
            if (identified.isFailure) {
                return Result.fail(`UnionTypeDeclaration.identifyData(): ${identified.errorTitle}`, identified.errorDescription!)
            }
            return Result.ok(identified.getValue())
        } else if (typedData.dataType instanceof IntersectedUnionType) {

        }

        return Result.ok(typedData);
    }
}