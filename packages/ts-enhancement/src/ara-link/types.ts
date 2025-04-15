import { type ObjectLikeKeyValue, type WithGetTextMethod } from "../keyValue.js"
import { isEqualArray } from "../array.js"
export const PurlProtocol = "purl";

/**
 * Ara Web protocol and Ara Web's Modules
 */
export const AraWebProtocol: string = "ara-web";
export const AraWebModuleSlugs: string[] = ["ara-web", "module"]

export class AraLink<T> {
    private _protocol: string;
    private _slugs: string[];
    private _resource: string|T;
    private _properties: ObjectLikeKeyValue;

    constructor (protocol: string, resource: string|T, slugsOrProperties?: string[]|ObjectLikeKeyValue, properties?: ObjectLikeKeyValue) {
        const slugs = slugsOrProperties === undefined ? undefined :
         Array.isArray(slugsOrProperties) ? slugsOrProperties : undefined;
        properties = ((properties !== undefined) ? properties :
            ((slugsOrProperties !== undefined) ? !Array.isArray(slugsOrProperties) ?
            slugsOrProperties : undefined : undefined));
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

    public copyWithProperties = (properties: ObjectLikeKeyValue): AraLink<T> => {
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
        let url = `${this._protocol}:${this.slugs.join('/')}:${resourceUrl}`
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

        if (!isEqualArray(this.slugs, slugs)) {
            return false;
        }

        return true;
    }
}
