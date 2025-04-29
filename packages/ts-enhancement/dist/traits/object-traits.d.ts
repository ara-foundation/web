export declare class ObjectTraits {
    /**
     * Class decorator to implement interface with the static methods.
     *
     * @example
     * ```
     * import { ObjectTraits } from "@ara-web/ts-enhancement/traits";
     *
     * // First create interface with non-static methods, it can be empty
     * interface NonStatic {
     *      strMethod(): string;
     *      numMethod(): number;
     * }
     *
     * // Then, create the interface with static method with new() property:
     * interface Static {
     *      new(): NonStatic;
     *      version: string;    // Static property
     * }
     *
     * // Finally create a class using decorator
     * @ObjectTraits.staticImplements<Static>()
     * class Class {
     *      strMethod(): string { return "Hello World"; }
     *      numMethod(): number { return -1; }
     *      static version: string = "v1.0.0";
     * }
     * ```
     */
    static staticImplements<T>(): <U extends T>(constructor: U) => void;
    /**
     * Copies the object without any referencing. So editing the object won't write another instance property.
     * @param obj
     * @returns
     */
    static deepCopy(obj: object): object;
}
