import * as CSSWhat from "css-what";
import {
    type Options, 
    selectAll, 
    selectOne, 
    is
} from "css-select";

export class LinkTraits {
// Queries elems, returns an array containing all matches.
    public static getAll<ObjectNode, BranchedModuleObject extends ObjectNode>(query: string, objects: ObjectNode[], options: Options<ObjectNode, BranchedModuleObject>): ObjectNode[] {
        return selectAll<ObjectNode, BranchedModuleObject>(query, objects, options);
    }

    public static isObjectMatchQuery<ObjectNode, BranchedModuleObject extends ObjectNode>(node: BranchedModuleObject, query: string, options: Options<ObjectNode, BranchedModuleObject>): boolean {
        return is<ObjectNode, BranchedModuleObject>(node, query, options);
    }

    public static get<ObjectNode, BranchedModuleObject extends ObjectNode>(query: string, objects: ObjectNode[], options: Options<ObjectNode, BranchedModuleObject>): ObjectNode | null {
        return selectOne<ObjectNode, BranchedModuleObject>(query, objects, options);
    }

    public static parseSelector(query: string): CSSWhat.Selector[][] {
        try {
            const what = CSSWhat.parse(query);
            if (what.length === 0) {
                return [];
            } 
            return what;
        } catch {
            return [];
        }
    }

    public static isAttributeSelector(query: string): boolean {
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

    public static getTagName(query: string): string|null {
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

    public static getAttributeName(query: string): string|null {
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

    public static trimAttribute(query: string): string {
        if (!this.isAttributeSelector(query)) {
            return query;
        }

        const parsed = this.parseSelector(query);
        const lastToken = parsed[parsed.length - 1];
        const lastIndex = lastToken.length - 1;
        parsed[parsed.length - 1] = [...(lastToken.slice(0, lastIndex))]
        return CSSWhat.stringify(parsed);
    }
}
