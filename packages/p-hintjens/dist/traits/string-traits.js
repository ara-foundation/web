export class StringTraits {
    /**
     * Make the first letter uppercase
     * @param {string} val a string to capitalize
     * @returns {string}
     */
    static capitalizeFirstLetter = (val) => {
        return String(val).charAt(0).toUpperCase() + String(val).slice(1);
    };
    /**
     * In some situation for example in parsing the Typescript code itself, some strings are represented by quotes.
     * This function returns it without the quotes.
     *
     * If it's not possible to unquote, then simply return string itself
     * @param {string} val a quoted string
     */
    static unquote = (val) => {
        try {
            return JSON.parse(val);
        }
        catch (_) {
            if (val.length >= 2 && val[0] === "'") {
                return val.substring(1).substring(0, val.length - 2);
            }
        }
        return val;
    };
}
