export declare class StringTraits {
    /**
     * Make the first letter uppercase
     * @param {string} val a string to capitalize
     * @returns {string}
     */
    static capitalizeFirstLetter: (val: string) => string;
    /**
     * In some situation for example in parsing the Typescript code itself, some strings are represented by quotes.
     * This function returns it without the quotes.
     *
     * If it's not possible to unquote, then simply return string itself
     * @param {string} val a quoted string
     */
    static unquote: (val: string) => string;
}
