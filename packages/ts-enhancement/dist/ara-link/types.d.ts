import { type ObjectLikeKeyValue, type ObjectValueLike } from "../keyValue.js";
export declare const PurlProtocol = "purl";
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
    constructor(protocol: string, resource: string | T, slugsOrProperties?: string[] | ObjectLikeKeyValue, properties?: ObjectLikeKeyValue);
    copyWithProperties: (properties: ObjectLikeKeyValue) => AraLink<T>;
    isEmpty: () => boolean;
    get protocol(): string;
    get slugs(): string[];
    get resource(): (typeof this._resource);
    get properties(): ObjectLikeKeyValue;
    isPropertyExist(property: string): boolean;
    property: (property: string) => ObjectValueLike | undefined;
    toString: () => string;
    lastSlug: () => string | undefined;
    /**
     * Returns true if the link is following the protocol and in the slugs path
     * @param protocol
     * @param slugs
     * @returns
     */
    isCorrectPath: (protocol: string, slugs: string[]) => boolean;
}
