import type { PurlQualifiers } from "packageurl-js";
import { ArrayTraits, type WithGetTextMethod } from "../index.js";
import { ModuleLink } from "./ModuleLink.js";
import path from "path";

export const NpmProtocol = "npm";

/**
 * Ara Web protocol and Ara Web's Modules
 */
export const AraWebProtocol: string = "ara-web";
export const AraWebModuleSlugs: string[] = ["ara-web", "module"]

export class AraLink<T> {
    private _protocol: string;
    private _slugs: string[];
    private _resource: string|T;
    private _properties: object;

    constructor (protocol: string, resource: string|T, slugs: string[], properties?: object) {
        this._protocol = protocol;
        this._resource = resource;
        if (slugs !== undefined) {
            this._slugs = slugs;
        } else {
            this._slugs = [];
        }
        if (properties !== undefined) {
            this._properties = properties;
        } else {
            this._properties = {}
        }
        return this;
    }

    public copyWithProperties = (properties: object): AraLink<T> => {
        const araLink = new AraLink(this._protocol, this._resource, this._slugs, properties);
        return araLink;
    }

    public isEmpty = (): boolean => {
        if (this._resource === undefined || this._resource === null) {
            return true;
        } 
        let resourceStr = this._resource.toString();
        if (resourceStr.length === 0) {
            return true;
        } 
        return false;
    }

    public get protocol(): string {
        return this._protocol;
    }

    public get slugs(): string[] {
        return this._slugs;
    }

    public get resource(): (typeof this._resource) {
        return this._resource;
    }

    public get properties(): object {
        return this._properties;
    }

    public isPropertyExist(property: string): boolean {
        if (this._properties === undefined) {
            return false;
        }
        if (property in this._properties) {
            return true;
        }
        return false;
    }

    public property = (property: string): object|undefined => {
        if (!this.isPropertyExist(property)) {
            return undefined;
        }

        return (this._properties as any)[property]
    }

    public toString = () : string => {
        let resourceUrl: string = "";
        if (typeof this.resource === "string") {
            resourceUrl = this.resource.toString();
        } else {
            if ((this.resource as WithGetTextMethod)["getText"] !== undefined &&
                (this.resource as WithGetTextMethod)["getText"] !== null) {
                resourceUrl = (this.resource as WithGetTextMethod).getText();
            } else {
                resourceUrl = (this.resource as any).toString();
            }
        }
        let url = `${this._protocol}:${this.slugs.join('/')}/${resourceUrl}`
        let properties: string = "";
        for (let key in this._properties) {
            if (properties.length > 0 && properties[properties.length - 1] !== "&") {
                properties += "&"
            }
            properties += `${key}=${(this._properties as any)[key]}`
        }
        if (properties.length > 0) {
            properties = "?" + properties;
        }

        return url + properties;
    }

    public toModuleLink = (): ModuleLink => {
        const schema = this._protocol;
        const namespace = this._slugs.length === 0 ? "" : this._slugs[0]
        const name: string = this._resource as string;
        let subPath: string = "";
        if (this._slugs !== undefined && this._slugs.length > 1) {
            subPath = this.slugs.filter((_, index) => (index > 0)).join(path.sep)
        }
        const qualifiers: PurlQualifiers = {
            ...this._properties
        }
        const pkgUrl = ModuleLink.newPackageURLWithQualifiers(
            namespace,
            name,
            qualifiers,
            subPath,
            schema
        );

        return pkgUrl;
    }

    public static fromModuleLink = (moduleLink: ModuleLink): AraLink<string> => {
        if (moduleLink.isFileURL) {
            const filePath = moduleLink.toFilePath;
            const resource = path.basename(filePath);
            const slugs = path.dirname(filePath).split(path.sep);
            return new AraLink<string>("file", resource, slugs);
        }

        const pkgURL = moduleLink.toPkgURL;

        const protocol = pkgURL.type;
        const slugs: string[] = [];
        if (pkgURL.namespace) {
            slugs.push(pkgURL.namespace);
        }
        if (pkgURL.subpath) {
            slugs.push(...pkgURL.subpath.split(path.sep))
        }
        const resource = pkgURL.name;
        const araLink = new AraLink<string>(protocol, resource, slugs);
        if (pkgURL.qualifiers !== undefined) {
            araLink._properties = pkgURL.qualifiers;
        }

        return araLink;
    }

    public lastSlug = (): string|undefined => {
        if (this._slugs.length === 0) {
            return undefined;
        }

        return this._slugs[this._slugs.length - 1];
    }

    /**
     * Returns true if the link is following the protocol and in the slugs path
     * @param protocol 
     * @param slugs 
     * @returns 
     */
    public isCorrectPath = (protocol: string, slugs: string[]): boolean => {
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
    }
}

