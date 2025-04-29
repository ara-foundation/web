import type { AstroNode } from "#ontology";
import type { Node } from "@astrojs/compiler/types";
import type { Props } from "astro";
type AstroImport = ((_props: Props) => any);
type TsxImport = (({ children }: Props) => React.JSX.Element);
type JsxImport = (() => React.JSX.Element);
export type AstroNodeType = AstroImport | TsxImport | JsxImport;
export declare class AstroNodeTraits {
    static componentName: (astNode: AstroNode) => string;
    static isSupportedNode: (node: Node) => boolean;
}
export {};
