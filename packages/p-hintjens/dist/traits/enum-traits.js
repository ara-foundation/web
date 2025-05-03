/**
 * Useful methods to work with the Enum that Typescript doesn't have,
 */
export class EnumTraits {
    // console.log(enumKeys(Es)); // ["A", "B", "C"]
    static enumKeys(e) {
        const keys = Object.keys(e);
        const isStringEnum = isNaN(Number(keys[0]));
        return isStringEnum ? keys : keys.slice(keys.length / 2);
    }
    // console.log(enumValues(En)); // [0, 1, 2]
    static enumValues(e) {
        const values = Object.values(e);
        const isNumEnum = e[e[values[0]]] === values[0];
        return isNumEnum ? values.slice(values.length / 2) : values;
    }
}
