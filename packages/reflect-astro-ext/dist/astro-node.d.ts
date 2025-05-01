import type { Props } from "astro";
type AstroImport = ((_props: Props) => any);
type TsxImport = (({ children }: Props) => React.JSX.Element);
type JsxImport = (() => React.JSX.Element);
export type AstroNodeType = AstroImport | TsxImport | JsxImport;
export {};
