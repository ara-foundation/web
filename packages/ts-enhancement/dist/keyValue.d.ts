export interface EnumlikeKeyValue {
    [key: string]: string | number;
}
export declare function enumKeys<T extends object>(e: T): string[];
export declare function enumValues<T extends object>(e: T): any[];
export type ObjectValueLike = string | number | boolean | (string | number | boolean | object)[];
export interface ObjectLikeKeyValue {
    [key: string]: ObjectValueLike;
}
export interface WithGetTextMethod {
    getText: () => string;
}
