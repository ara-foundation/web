import type { ModuleLink, Result } from "@ara-web/p-hintjens";

export interface ServiceMetaInterface {
    description: string;
    moduleLink: ModuleLink;
}

export interface ReflectProxyInterface {
    putBehindData?: <BehindProxy>(behindData: BehindProxy) => void
    publicMethods: string[];
}

export interface ReflectInterface {
    get?<T>(moduleCategory: string): Promise<Result<T[]>>;
}