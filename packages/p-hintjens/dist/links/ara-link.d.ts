import { ModuleLink, type ModuleURL } from "./module-link.js";
export declare const NpmProtocol = "npm";
export type AraURL = `ara:` | `sever:` | `reflect:` | `http://${string}` | `https://${string}` | `ws://${string}` | ModuleURL | `this`;
/**
 * Ara Web protocol and Ara Web's Modules
 */
export declare const AraWebProtocol: string;
export declare const AraWebModuleSlugs: string[];
export declare class AraLink<T> {
    private _protocol;
    private _slugs;
    private _resource;
    private _properties;
    constructor(protocol: string, resource: string | T, slugs: string[], properties?: object);
    copyWithProperties: (properties: object) => AraLink<T>;
    isEmpty: () => boolean;
    get protocol(): string;
    get slugs(): string[];
    get resource(): (typeof this._resource);
    get properties(): object;
    isPropertyExist(property: string): boolean;
    property: (property: string) => object | undefined;
    toString: () => string;
    toModuleLink: () => ModuleLink;
    static fromModuleLink: (moduleLink: ModuleLink) => AraLink<string>;
    lastSlug: () => string | undefined;
    /**
     * Returns true if the link is following the protocol and in the slugs path
     * @param protocol
     * @param slugs
     * @returns
     */
    isCorrectPath: (protocol: string, slugs: string[]) => boolean;
}
