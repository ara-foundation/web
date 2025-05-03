/**
 * A certain element in the Module.
 * Inspired by the CSS selector.
 * 
 * The format of the link is:
 * ```
 * obj://<css-selector>?module-link=<module-link>&resource-link=<resource-link>
 * 
 * obj:id#varName[proppertyName]?module-link=file://path/to/module.ts&resource-link=this
 * ```
 * 
 * Where:
 * - `obj://` is the schema to identify the link as an object link.
 * - `<css-selector>` is the CSS selector to identify the element in the module.
 * - `?module-link=<module-link>` is the module where object located.
 * - `?resource-link=<resource-link>` is the resource that machine could understand and locate.
 */
import type { ModuleLink, ModuleURL } from "./module-link.js";

export type Selector = string;
export type ResourceURL = string;

export type ObjectURL = `obj://${Selector}` | `obj://${Selector}?` |
 `obj://${Selector}?module-link=${ModuleURL}` |
 `obj://${Selector}?module-link=${ModuleURL}&resource-link=${ResourceURL}` |
 `obj://${Selector}?resource-link=${ModuleURL}` |
 `obj://${Selector}?resource-link=${ModuleURL}&module-link=${ResourceURL}`;
type Tagged = {tag: string, id: string|number};
const ALL_LINK = "*";

// First component when defined
// componentLink = ComponentLevel.getObjectLinkOf<Component>(component, moduleURL);
// creates obj://layout#index.astro?module-link=pkg:npm/@ara-web/reflect-astro-ext?category=layouts#/src/layouts/AraWebLayout.astro&resource-link=this
// When identifying attributes of the component
// componentLink.getObjectLinkOf<Attributes>(attribute, moduleURL);
// creates obj://layout#index[attribute_name=1]
// nested components are added by calling
// componentLink.getObjectLinkOf<Component>(component, moduleURL);
// in this case:
// creates obj://layout#index[attribute_name=1]>component#componentName[proppertyName]?module-link=pkg:npm/@ara-web/reflect-astro-ext?category=layouts#/src/layouts/AraWebLayout.astro&resource-link=this
// The slots are added as:
// creates obj://slot#slotName>component#componentName[proppertyName]?module-link=pkg:npm/@ara-web/reflect-astro-ext?category=layouts#/src/layouts/AraWebLayout.astro&resource-link=this
export class ObjectLink {
    private _selectors: Tagged[];
    private _moduleLink?: ModuleLink;
    private _resourceLink?: ResourceURL;
    private _enumeratedCount: number = 0;

    /**
     * Creates an empty object link. Optionally, could specify the module link and resource link.
     * @param moduleLink The module link where the object is located.
     * @param resourceLink The resource link that machine could understand and locate.
     */
    constructor(moduleLink?: ModuleLink, resourceLink?: ResourceURL) {
        this._selectors = [];
        this._moduleLink = moduleLink;
        this._resourceLink = resourceLink;
    }

    public get enumared(): number {
        return this._enumeratedCount;
    }

    public get selector(): Selector {
        if (this._selectors.length === 0) {
            return ALL_LINK;
        }
        return this._selectors.map((selector): string => {
            if (typeof selector.id === "number") {
                return `${selector.tag}:nth-child(${selector.id.toString()})`;
            }
            return `${selector.tag}#${selector.id}`;
        }).join(">");
    }

    public get moduleLink(): ModuleLink|undefined {
        return this._moduleLink;
    }

    public get resourceLink(): ResourceURL|undefined {
        return this._resourceLink;
    }

    /**
     * The getId method returns the object's id.
     * 
     * It gets the last selector as the current object. If it's tagged, then it returns the id.
     * Otherwise, it returns undefined.
     */
    public getId(): string|number {
        if (this._selectors.length === 0) {
            return ALL_LINK;
        }
        return this._selectors[this._selectors.length - 1].id;
    }

    public getTag(): string {
        if (this._selectors.length === 0) {
            return ALL_LINK;
        }
        return this._selectors[this._selectors.length - 1].tag;
    }

    /**
     * The getAsChildLink method creates and returns
     * a new ObjectLink instance that copies the current instance's module and resource links
     * and extends its CSS selector by appending a child selector with the specified tag and id.
     * Example:
     * ```
     * const childLink = parentLink.getEnumratedChild("div");
     * // childLink.cssSelector will be "div#0"
     * const childLink2 = childLink.getAsParent().getEnumratedChild("varName");
     * // childLink2.cssSelector will be "div#0 > varName#1"
     * ```
     * @param tag The tag of the child element.
     * @returns 
     */
    public getEnumuratedChild(tag: string): ObjectLink {
        const childLink = new ObjectLink(this._moduleLink, this._resourceLink);
        childLink._selectors = [...this._selectors, {tag, id: this._enumeratedCount++}];
        return childLink;
    }

    /**
     * The getTaggedChild method creates and returns
     * a new ObjectLink instance that copies the current instance's module and resource links
     * and extends its CSS selector by appending a child selector with the specified tag and id.
     * Example:
     * ```
     * const childLink = parentLink.getTaggedChild("div", "varName");
     * // childLink.cssSelector will be "div#varName"
     * ```
     * @param tag The tag of the child element.
     * @param id The id of the child element.
     * @returns 
     */
    public getTaggedChild(tag: string, id: string): ObjectLink {
        const childLink = new ObjectLink(this._moduleLink, this._resourceLink);
        childLink._selectors = [...this._selectors, {tag, id}];
        return childLink;
    }

    public toString(): ObjectURL {
        let url = `obj://${this.selector}`;
        if (this._moduleLink !== undefined) {
            url += `?module-link=${this._moduleLink}`;
            if (this._resourceLink !== undefined) {
                url += `&resource-link=${this._resourceLink}`;
            }
        }
        return url as ObjectURL;
    }
}