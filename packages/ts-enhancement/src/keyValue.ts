export interface EnumlikeKeyValue {
    [key: string]: string|number;
}

export interface ObjectLikeKeyValue {
    [key: string]: string|number|boolean|(string|number|boolean|object)[]
}

export interface WithGetTextMethod {
    getText: () => string,
}