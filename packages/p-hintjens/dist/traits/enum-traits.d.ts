/**
 * Useful methods to work with the Enum that Typescript doesn't have,
 */
export declare class EnumTraits {
    static enumKeys<T extends object>(e: T): string[];
    static enumValues<T extends object>(e: T): any[];
}
