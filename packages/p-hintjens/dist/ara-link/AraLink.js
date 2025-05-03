import { ArrayTraits } from "../index.js";
import { ModuleLink } from "./ModuleLink.js";
import path from "path";
export const NpmProtocol = "npm";
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
    constructor(protocol, resource, slugs, properties) {
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
        let url = `${this._protocol}:${this.slugs.join('/')}/${resourceUrl}`;
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
    toModuleLink = () => {
        const schema = this._protocol;
        const namespace = this._slugs.length === 0 ? "" : this._slugs[0];
        const name = this._resource;
        let subPath = "";
        if (this._slugs !== undefined && this._slugs.length > 1) {
            subPath = this.slugs.filter((_, index) => (index > 0)).join(path.sep);
        }
        const qualifiers = {
            ...this._properties
        };
        const pkgUrl = ModuleLink.newPackageURLWithQualifiers(namespace, name, qualifiers, subPath, schema);
        return pkgUrl;
    };
    static fromModuleLink = (moduleLink) => {
        if (moduleLink.isFileURL) {
            const filePath = moduleLink.toFilePath;
            const resource = path.basename(filePath);
            const slugs = path.dirname(filePath).split(path.sep);
            return new AraLink("file", resource, slugs);
        }
        const pkgURL = moduleLink.toPkgURL;
        const protocol = pkgURL.type;
        const slugs = [];
        if (pkgURL.namespace) {
            slugs.push(pkgURL.namespace);
        }
        if (pkgURL.subpath) {
            slugs.push(...pkgURL.subpath.split(path.sep));
        }
        const resource = pkgURL.name;
        const araLink = new AraLink(protocol, resource, slugs);
        if (pkgURL.qualifiers !== undefined) {
            araLink._properties = pkgURL.qualifiers;
        }
        return araLink;
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
        if (!ArrayTraits.isEqualArray(this.slugs, slugs)) {
            return false;
        }
        return true;
    };
}
