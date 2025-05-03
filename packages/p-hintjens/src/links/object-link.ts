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

// First component when defined
// componentLink = ComponentLevel.getObjectLinkOf<Component>(component, moduleURL);
// creates obj:layout#index.astro?module-link=pkg:npm/@ara-web/reflect-astro-ext?category=layouts#/src/layouts/AraWebLayout.astro&resource-link=this
// When identifying attributes of the component
// componentLink.getObjectLinkOf<Attributes>(attribute, moduleURL);
// creates obj:/layout#index[attribute_name=1]
// nested components are added by calling
// componentLink.getObjectLinkOf<Component>(component, moduleURL);
// in this case:
// creates obj:/layout#index[attribute_name=1]>component#componentName[proppertyName]?module-link=pkg:npm/@ara-web/reflect-astro-ext?category=layouts#/src/layouts/AraWebLayout.astro&resource-link=this
// The slots are added as:
// creates obj:/slot#slotName>component#componentName[proppertyName]?module-link=pkg:npm/@ara-web/reflect-astro-ext?category=layouts#/src/layouts/AraWebLayout.astro&resource-link=this

export class ObjectLink {
    private _cssSelector: CSSSelector;
    private _moduleLink?: ModuleLink;
    private _resourceLink?: ResourceURL;

    constructor(cssSelector: CSSSelector, moduleLink?: ModuleLink, resourceLink?: ResourceURL) {
        this._cssSelector = cssSelector;
        this._moduleLink = moduleLink;
        this._resourceLink = resourceLink;
    }

    public get cssSelector(): CSSSelector {
        return this._cssSelector;
    }

    public get moduleLink(): ModuleLink|undefined {
        return this._moduleLink;
    }

    public get resourceLink(): ResourceURL|undefined {
        return this._resourceLink;
    }
}