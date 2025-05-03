/**
 * A certain element in the Module.
 * Inspired by the CSS selector.
 *
 * The format of the link is:
 * ```
 * obj:<css-selector>?module-link=<module-link>&resource-link=<resource-link>
 *
 * obj:id#varName[proppertyName]?module-link=file://path/to/module.ts&resource-link=this
 * ```
 *
 * Where:
 * - `obj:` is the schema to identify the link as an object link.
 * - `<css-selector>` is the CSS selector to identify the element in the module.
 * - `?module-link=<module-link>` is the module where object located.
 * - `?resource-link=<resource-link>` is the resource that machine could understand and locate.
 */
import type { ModuleLink, ModuleURL } from "./module-link.js";
export type CSSSelector = string;
export type ResourceURL = string;
export type ObjectURL = `obj:${CSSSelector}?module-link=${ModuleURL}&resource-link=${ResourceURL}`;
export declare class ObjectLink {
    private _cssSelector;
    private _moduleLink?;
    private _resourceLink?;
    constructor(cssSelector: CSSSelector, moduleLink?: ModuleLink, resourceLink?: ResourceURL);
    get cssSelector(): CSSSelector;
    get moduleLink(): ModuleLink | undefined;
    get resourceLink(): ResourceURL | undefined;
}
