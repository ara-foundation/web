import * as CSSWhat from "css-what";
import { type Options } from "css-select";
export declare class LinkTraits {
    static getAll<ObjectNode, BranchedModuleObject extends ObjectNode>(query: string, objects: ObjectNode[], options: Options<ObjectNode, BranchedModuleObject>): ObjectNode[];
    static isObjectMatchQuery<ObjectNode, BranchedModuleObject extends ObjectNode>(node: BranchedModuleObject, query: string, options: Options<ObjectNode, BranchedModuleObject>): boolean;
    static get<ObjectNode, BranchedModuleObject extends ObjectNode>(query: string, objects: ObjectNode[], options: Options<ObjectNode, BranchedModuleObject>): ObjectNode | null;
    static parseSelector(query: string): CSSWhat.Selector[][];
    static isAttributeSelector(query: string): boolean;
    static getTagName(query: string): string | null;
    static getAttributeName(query: string): string | null;
    static trimAttribute(query: string): string;
}
