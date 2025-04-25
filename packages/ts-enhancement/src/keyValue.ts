export interface EnumlikeKeyValue {
    [key: string]: string|number;
}

// console.log(enumKeys(Es)); // ["A", "B", "C"]
export function enumKeys<T extends object>(e: T) {
    const keys = Object.keys(e)
    const isStringEnum = isNaN(Number(keys[0]))
    return isStringEnum ? keys : keys.slice(keys.length / 2)
}

// console.log(enumValues(En)); // [0, 1, 2]
export function enumValues<T extends object>(e: T) {
    const values = Object.values(e)
    const isNumEnum = (e as any)[(e as any)[values[0]]] === values[0]
    return isNumEnum ? values.slice(values.length / 2) : values
}

export type ObjectValueLike = string|number|boolean|(string|number|boolean|object)[];

export interface ObjectLikeKeyValue {
    [key: string]: ObjectValueLike
}

export interface WithGetTextMethod {
    getText: () => string,
}