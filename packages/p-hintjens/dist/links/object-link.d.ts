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
export type ObjectURL = `obj://${Selector}` | `obj://${Selector}?` | `obj://${Selector}?module-link=${ModuleURL}` | `obj://${Selector}?module-link=${ModuleURL}&resource-link=${ResourceURL}` | `obj://${Selector}?resource-link=${ModuleURL}` | `obj://${Selector}?resource-link=${ModuleURL}&module-link=${ResourceURL}`;
export declare class ObjectLink {
    private _selectors;
    private _moduleLink?;
    private _resourceLink?;
    private _enumeratedCount;
    /**
     * Creates an empty object link. Optionally, could specify the module link and resource link.
     * @param moduleLink The module link where the object is located.
     * @param resourceLink The resource link that machine could understand and locate.
     */
    constructor(moduleLink?: ModuleLink, resourceLink?: ResourceURL);
    get enumared(): number;
    get selector(): Selector;
    get moduleLink(): ModuleLink | undefined;
    get resourceLink(): ResourceURL | undefined;
    /**
     * The getId method returns the object's id.
     *
     * It gets the last selector as the current object. If it's tagged, then it returns the id.
     * Otherwise, it returns undefined.
     */
    getId(): string | number | undefined;
    /**
     * Puts the id of the last selector.
     * If id already exists, then it returns false.
     * Otherwise, it sets the id and returns true.
     * @param id
     * @returns
     */
    putId(id: string | number): boolean;
    getTag(): string | undefined;
    /**
     * The getClass method returns the object's first class.
     */
    getClass(index?: number): string[] | string;
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
    getEnumuratedChild(tag?: string, classes?: string[]): ObjectLink;
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
    getTaggedChild(tag: string, id?: string, classes?: string[]): ObjectLink;
    toString(): ObjectURL;
}
