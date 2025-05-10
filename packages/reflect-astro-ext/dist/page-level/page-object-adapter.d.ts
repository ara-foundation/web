import type { Slots } from "../index.js";
import type { Adapter, ObjectNode, Predicate } from "@ara-web/p-hintjens";
import { PageObjectNode } from "./page-object-node.js";
export declare const pageToObjectNodes: (slots: Slots) => PageObjectNode[];
export declare class PageObjectAdapter implements Adapter<ObjectNode, PageObjectNode> {
    isTag(elem: ObjectNode): elem is PageObjectNode;
    getChildren(elem: ObjectNode): ObjectNode[];
    getParent(elem: PageObjectNode): PageObjectNode | null;
    removeSubsets(nodes: ObjectNode[]): ObjectNode[];
    existsOne(test: Predicate<PageObjectNode>, elems: ObjectNode[]): boolean;
    getSiblings(elem: ObjectNode): ObjectNode[];
    getAttributeValue(elem: PageObjectNode, name: string): string | undefined;
    hasAttrib(elem: PageObjectNode, name: string): boolean;
    getName(elem: PageObjectNode): string;
    findOne(test: Predicate<PageObjectNode>, arr: ObjectNode[]): PageObjectNode | null;
    findAll(test: Predicate<PageObjectNode>, elems: ObjectNode[]): PageObjectNode[];
    getText(elem: ObjectNode): string;
}
