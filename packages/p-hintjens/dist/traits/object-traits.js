export class ObjectTraits {
    /**
     * Class decorator to implement interface with the static methods.
     *
     * @example
     * ```
     * import { ObjectTraits } from "@ara-web/p-hintjens/traits";
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
    static staticImplements() {
        return (constructor) => { constructor; };
    }
    /**
     * Copies the object without any referencing. So editing the object won't write another instance property.
     * @param obj
     * @returns
     */
    static deepCopy(obj) {
        var copy;
        // Handle the 3 simple types, and null or undefined
        if (null == obj || "object" != typeof obj)
            return obj;
        // Handle Date
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }
        // Handle Array
        if (obj instanceof Array) {
            copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = this.deepCopy(obj[i]);
            }
            return copy;
        }
        // Handle Object
        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr))
                    copy[attr] = this.deepCopy(obj[attr]);
            }
            return copy;
        }
        throw new Error("Unable to copy obj! Its type isn't supported.");
    }
}
