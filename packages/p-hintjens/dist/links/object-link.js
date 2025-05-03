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
    _cssSelector;
    _moduleLink;
    _resourceLink;
    constructor(cssSelector, moduleLink, resourceLink) {
        this._cssSelector = cssSelector;
        this._moduleLink = moduleLink;
        this._resourceLink = resourceLink;
    }
    get cssSelector() {
        return this._cssSelector;
    }
    get moduleLink() {
        return this._moduleLink;
    }
    get resourceLink() {
        return this._resourceLink;
    }
}
