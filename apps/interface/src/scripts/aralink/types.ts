import type { EnumMembers } from "@scripts/reflect/codeLevel/types";
import { Node } from "ts-morph"

export const PurlProtocol = "purl";
export const AraWebProtocol = "ara-web";
export const AraWebSlug = "ara-web";
export const AraWebModuleSlug = "module";
export const AraIdentifierSlugs = ["@", "scripts", "reflect", "codeLevel", "identifier"]
export const AraExpressionSlugs = ["@", "scripts", "reflect", "codeLevel", "expression"]

export class AraLink {
    private _protocol: string;
    private _slugs: string[];
    private _resource: string|Node;
    private _properties: EnumMembers;

    constructor (protocol: string, resource: string|Node, slugsOrProperties?: string[]|EnumMembers, properties?: EnumMembers) {
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

    public isEmpty = (): boolean => {
        if (this._resource === undefined) {
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
        if (this.resource instanceof Node) {
            resourceUrl = this.resource.getText();
        } else {
            resourceUrl = this.resource.toString();
        }
        let url = `${this._protocol}:${this.slugs.join('/')}:${resourceUrl}`
        let properties: string = "";
        for (let key in this._properties) {
            if (properties.length > 0 && properties[properties.length - 1] !== "&") {
                properties += "&"
            }
            properties += `${key}=${this._properties[key]}`
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
}
