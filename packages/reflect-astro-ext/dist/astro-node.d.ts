import type { Node, AttributeNode } from "@astrojs/compiler/types";
import { Result } from "@ara-web/p-hintjens";
export declare class AstroNode {
    private _node;
    private constructor();
    get name(): string;
    get value(): string;
    /**
     * Returns child nodes if they are supported by Astro Reflect.
     * Unsupported nodes will be omitted.
     */
    get children(): AstroNode[];
    get attributes(): AttributeNode[];
    setAttributes(attrs: AttributeNode[]): void;
    get isComponent(): boolean;
    get isHTMLElement(): boolean;
    get isExpression(): boolean;
    get isText(): boolean;
    static isSupportedNode: (node: Node) => boolean;
    static nodeValue: (node: Node) => string;
    static nodeChildren: (node: Node) => Node[];
    static nodeName: (node: Node) => string;
    static newFromNode(node: Node): Result<AstroNode>;
    static nodeAttributes: (node: Node) => AttributeNode[];
}
