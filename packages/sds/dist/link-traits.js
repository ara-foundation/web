import * as CSSWhat from "css-what";
import { selectAll, selectOne, is } from "css-select";
export class LinkTraits {
    // Queries elems, returns an array containing all matches.
    static getAll(query, objects, options) {
        return selectAll(query, objects, options);
    }
    static isObjectMatchQuery(node, query, options) {
        return is(node, query, options);
    }
    static get(query, objects, options) {
        return selectOne(query, objects, options);
    }
    static parseSelector(query) {
        try {
            const what = CSSWhat.parse(query);
            if (what.length === 0) {
                return [];
            }
            return what;
        }
        catch {
            return [];
        }
    }
    static isAttributeSelector(query) {
        const parsed = this.parseSelector(query);
        if (parsed.length < 1) {
            return false;
        }
        const lastIndex = parsed[0].length - 1;
        if (lastIndex < 0) {
            return false;
        }
        const lastToken = parsed[0][lastIndex];
        return lastToken.type === "attribute";
    }
    static getTagName(query) {
        const parsed = this.parseSelector(query);
        if (parsed.length < 1) {
            return null;
        }
        const selectors = parsed[0];
        for (let i = selectors.length - 1; i >= 0; i--) {
            const selector = selectors[i];
            if (selector.type === CSSWhat.SelectorType.Tag) {
                return selector.name;
            }
        }
        return null;
    }
    static getAttributeName(query) {
        const parsed = this.parseSelector(query);
        if (parsed.length < 1) {
            return null;
        }
        const lastIndex = parsed[0].length - 1;
        if (lastIndex < 0) {
            return null;
        }
        const lastToken = parsed[0][lastIndex];
        if (lastToken.type !== "attribute") {
            return null;
        }
        return lastToken.name;
    }
    static trimAttribute(query) {
        if (!this.isAttributeSelector(query)) {
            return query;
        }
        const parsed = this.parseSelector(query);
        const lastToken = parsed[parsed.length - 1];
        const lastIndex = lastToken.length - 1;
        parsed[parsed.length - 1] = [...(lastToken.slice(0, lastIndex))];
        return CSSWhat.stringify(parsed);
    }
}
