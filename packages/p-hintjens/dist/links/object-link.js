import { Debug } from "../index.js";
const ALL_LINK = "*";
/* First component when defined
 * componentLink = ComponentLevel.getObjectLinkOf<Component>(component, moduleURL);
 * creates obj://layout#index.astro?module-link=pkg:npm/@ara-web/reflect-astro-ext?category=layouts#/src/layouts/AraWebLayout.astro&resource-link=this
 * When identifying attributes of the component
 * componentLink.getObjectLinkOf<Attributes>(attribute, moduleURL);
 * creates obj://layout#index[attribute_name=1]
 * nested components are added by calling
 * componentLink.getObjectLinkOf<Component>(component, moduleURL);
 * in this case:
 * creates obj://layout#index[attribute_name=1]>component#componentName[proppertyName]?module-link=pkg:npm/@ara-web/reflect-astro-ext?category=layouts#/src/layouts/AraWebLayout.astro&resource-link=this
 * The slots are added as:
 * creates obj://slot#slotName>component#componentName[proppertyName]?module-link=pkg:npm/@ara-web/reflect-astro-ext?category=layouts#/src/layouts/AraWebLayout.astro&resource-link=this
*/
export class ObjectLink {
    _selectors;
    _moduleLink;
    _resourceLink;
    _enumeratedCount = 0;
    /**
     * Creates an empty object link. Optionally, could specify the module link and resource link.
     * @param moduleLink The module link where the object is located.
     * @param resourceLink The resource link that machine could understand and locate.
     */
    constructor(moduleLink, resourceLink) {
        this._selectors = [];
        this._moduleLink = moduleLink;
        this._resourceLink = resourceLink;
    }
    get enumared() {
        return this._enumeratedCount;
    }
    get selector() {
        if (this._selectors.length === 0) {
            return ALL_LINK;
        }
        return this._selectors.map((taggedSelector) => {
            let url = ``;
            if (taggedSelector.tag) {
                url += taggedSelector.tag;
            }
            if (taggedSelector.classes !== undefined && taggedSelector.classes.length > 0) {
                url += `.${taggedSelector.classes.join(".")}`;
            }
            if (taggedSelector.id !== undefined) {
                if (typeof taggedSelector.id === "number") {
                    url += `:nth-child(${taggedSelector.id})`;
                }
                else {
                    url += `#${taggedSelector.id}`;
                }
            }
            return url;
        }).join(">");
    }
    get moduleLink() {
        return this._moduleLink;
    }
    get resourceLink() {
        return this._resourceLink;
    }
    /**
     * The getId method returns the object's id.
     *
     * It gets the last selector as the current object. If it's tagged, then it returns the id.
     * Otherwise, it returns undefined.
     */
    getId() {
        if (this._selectors.length === 0) {
            return undefined;
        }
        return this._selectors[this._selectors.length - 1].id;
    }
    /**
     * Puts the id of the last selector.
     * If id already exists, then it returns false.
     * Otherwise, it sets the id and returns true.
     * @param id
     * @returns
     */
    putId(id) {
        if (this._selectors.length === 0) {
            return false;
        }
        const lastSelector = this._selectors[this._selectors.length - 1];
        if (lastSelector.id !== undefined) {
            return false;
        }
        this._selectors[this._selectors.length - 1].id = id;
        return true;
    }
    getTag() {
        if (this._selectors.length === 0) {
            return undefined;
        }
        return this._selectors[this._selectors.length - 1].tag;
    }
    /**
     * The getClass method returns the object's first class.
     */
    getClass() {
        if (this._selectors.length === 0) {
            return undefined;
        }
        const lastSelector = this._selectors[this._selectors.length - 1];
        if (lastSelector.classes === undefined || lastSelector.classes.length === 0) {
            return undefined;
        }
        return lastSelector.classes[0];
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
    getEnumuratedChild(tag, classes) {
        const childLink = new ObjectLink(this._moduleLink, this._resourceLink);
        childLink._selectors = [...this._selectors, { tag, id: this._enumeratedCount++, classes }];
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
    getTaggedChild(tag, id, classes) {
        const childLink = new ObjectLink(this._moduleLink, this._resourceLink);
        childLink._selectors = [...this._selectors, { tag, id, classes }];
        return childLink;
    }
    toString() {
        let url = `obj://${this.selector}`;
        if (this._moduleLink !== undefined) {
            url += `?module-link=${this._moduleLink}`;
            if (this._resourceLink !== undefined) {
                url += `&resource-link=${this._resourceLink}`;
            }
        }
        return url;
    }
}
