export interface EnumlikeKeyValue {
    [key: string]: string | number;
}
export type ObjectValueLike = string | number | boolean | (string | number | boolean | object)[];
export interface ObjectLikeKeyValue {
    [key: string]: ObjectValueLike;
}
export interface WithGetTextMethod {
    getText: () => string;
}
