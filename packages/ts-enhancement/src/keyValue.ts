export interface EnumlikeKeyValue {
    [key: string]: string|number;
}

export interface WithGetTextMethod {
    getText: () => string,
}