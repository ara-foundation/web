import { type Adapter, type Predicate } from "@ara-web/p-hintjens";
/**
 * The `NodeAdapter` is an adapter for the DOM Node interface.
 * Interact with the DOM elements using CSS.
 * Combined with the `@ara-web/p-hintjens/rest` package, it can be used to
 * interact with the DOM elements using CSS selectors.
 */
export declare class NodeAdapter implements Adapter<Node, HTMLElement> {
    private EMPTY_OBJECT;
    isTag(elem: Node): elem is HTMLElement;
    getChildren(elem: Node): Node[];
    getParent(elem: HTMLElement): HTMLElement | null;
    removeSubsets(nodes: Node[]): Node[];
    existsOne(test: Predicate<HTMLElement>, elems: Node[]): boolean;
    getSiblings(elem: Node): Node[];
    getAttributeValue(elem: HTMLElement, name: string): string | undefined;
    hasAttrib(elem: HTMLElement, name: string): boolean;
    getName(elem: HTMLElement): string;
    findOne(test: Predicate<HTMLElement>, arr: Node[]): HTMLElement | null;
    findAll(test: Predicate<HTMLElement>, elems: Node[]): HTMLElement[];
    getText(elem: Node): string;
}
