import {} from "../keyValue.js";
import { isEqualArray } from "../array.js";
export const PurlProtocol = "purl";
/**
 * Ara Web protocol and Ara Web's Modules
 */
export const AraWebProtocol = "ara-web";
export const AraWebModuleSlugs = ["ara-web", "module"];
export class AraLink {
    _protocol;
    _slugs;
    _resource;
    _properties;
    constructor(protocol, resource, slugsOrProperties, properties) {
        const slugs = slugsOrProperties === undefined ? undefined :
            Array.isArray(slugsOrProperties) ? slugsOrProperties : undefined;
        properties = ((properties !== undefined) ? properties :
            ((slugsOrProperties !== undefined) ? !Array.isArray(slugsOrProperties) ?
                slugsOrProperties : undefined : undefined));
        this._protocol = protocol;
        this._resource = resource;
        if (slugs !== undefined) {
            this._slugs = slugs;
        }
        else {
            this._slugs = [];
        }
        if (properties !== undefined) {
            this._properties = properties;
        }
        else {
            this._properties = {};
        }
        return this;
    }
    copyWithProperties = (properties) => {
        const araLink = new AraLink(this._protocol, this._resource, this._slugs, properties);
        return araLink;
    };
    isEmpty = () => {
        if (this._resource === undefined || this._resource === null) {
            return true;
        }
        let resourceStr = this._resource.toString();
        if (resourceStr.length === 0) {
            return true;
        }
        return false;
    };
    get protocol() {
        return this._protocol;
    }
    get slugs() {
        return this._slugs;
    }
    get resource() {
        return this._resource;
    }
    get properties() {
        return this._properties;
    }
    isPropertyExist(property) {
        if (this._properties === undefined) {
            return false;
        }
        if (property in this._properties) {
            return true;
        }
        return false;
    }
    property = (property) => {
        if (!this.isPropertyExist(property)) {
            return undefined;
        }
        return this._properties[property];
    };
    toString = () => {
        let resourceUrl = "";
        if (typeof this.resource === "string") {
            resourceUrl = this.resource.toString();
        }
        else {
            if (this.resource["getText"] !== undefined &&
                this.resource["getText"] !== null) {
                resourceUrl = this.resource.getText();
            }
            else {
                resourceUrl = this.resource.toString();
            }
        }
        let url = `${this._protocol}:${this.slugs.join('/')}:${resourceUrl}`;
        let properties = "";
        for (let key in this._properties) {
            if (properties.length > 0 && properties[properties.length - 1] !== "&") {
                properties += "&";
            }
            properties += `${key}=${this._properties[key]}`;
        }
        if (properties.length > 0) {
            properties = "?" + properties;
        }
        return url + properties;
    };
    lastSlug = () => {
        if (this._slugs.length === 0) {
            return undefined;
        }
        return this._slugs[this._slugs.length - 1];
    };
    /**
     * Returns true if the link is following the protocol and in the slugs path
     * @param protocol
     * @param slugs
     * @returns
     */
    isCorrectPath = (protocol, slugs) => {
        if (this.protocol !== protocol) {
            return false;
        }
        if (this.slugs.length === 0) {
            return false;
        }
        if (!isEqualArray(this.slugs, slugs)) {
            return false;
        }
        return true;
    };
}
