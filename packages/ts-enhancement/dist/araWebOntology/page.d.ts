/**
 * Global Shared Data Types of Ara
 */
import { RpcType, type RpcCallType } from "./rpc.js";
import { ColumnSlug, RowSlug } from "./layout.js";
import { type IdentifiedComponent } from "./component.js";
/**
 * A web page as a JSON-AD object
 */
export type Page = {
    title: string;
    description: string;
    fileName: string;
    components?: {
        [key in RowSlug]?: {
            [key in ColumnSlug]?: (IdentifiedComponent)[];
        };
    };
    metaComponents?: (IdentifiedComponent)[];
    rpcs?: {
        [key in RpcType]?: RpcCallType[];
    };
    glob: unknown;
};
