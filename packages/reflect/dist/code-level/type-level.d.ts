import { Result } from "@ara-web/ts-enhancement/result";
import type { TypedData } from "./ast-node.js";
export declare class TypeLevel {
    /**
     * Validates the data type of the data
     * @param typedData
     */
    static matchDataToType: (typedData: TypedData) => Result<TypedData>;
}
