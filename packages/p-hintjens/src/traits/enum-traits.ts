/**
 * Useful methods to work with the Enum that Typescript doesn't have,
 */
export class EnumTraits {
    // console.log(enumKeys(Es)); // ["A", "B", "C"]
    public static enumKeys<T extends object>(e: T): string[] {
        const keys = Object.keys(e)
        const isStringEnum = isNaN(Number(keys[0]))
        return isStringEnum ? keys : keys.slice(keys.length / 2)
    }

    // console.log(enumValues(En)); // [0, 1, 2]
    public static enumValues<T extends object>(e: T): any[] {
        const values = Object.values(e)
        const isNumEnum = (e as any)[(e as any)[values[0]]] === values[0]
        return isNumEnum ? values.slice(values.length / 2) : values
    }
}
