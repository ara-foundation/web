export declare enum RpcType {
    Extension = "extension",
    Independent = "independent",
    Proxy = "proxy"
}
export type ExtensionType = {
    name?: string;
    description?: string;
    pageUrl?: string;
    inputs?: any[];
    slug: string;
    rpcType?: RpcType.Extension;
    componentFilePath?: string;
};
export type RpcCallType = {
    slug: string;
    rpcType: RpcType;
    inputs: any[];
    outputs?: any[];
};
export type InputDescriptions = {
    inputDescriptions: {
        type: string;
        description: string;
    }[];
};
export type RPC = (ExtensionType & InputDescriptions);
